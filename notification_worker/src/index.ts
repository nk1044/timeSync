import 'dotenv/config';
import { Redis } from '@upstash/redis';
import admin from "firebase-admin";

// Configuration
const CONFIG = {
  CONCURRENT_WORKERS: parseInt(process.env.CONCURRENT_WORKERS || '5'),
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '10'),
  RETRY_ATTEMPTS: parseInt(process.env.RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY || '1000'),
  POLL_INTERVAL: parseInt(process.env.POLL_INTERVAL || '1000'),
  HEALTH_CHECK_INTERVAL: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
  MAX_WAIT_TIME: parseInt(process.env.MAX_WAIT_TIME || '86400000'), // 24 hours
} as const;

// Redis setup
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

// Firebase setup
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

export const messaging = admin.messaging();
export const firebaseAdmin = admin;

const QUEUE_NAME = process.env.UPSTASH_REDIS_QUEUE as string;
const RETRY_QUEUE_NAME = `${QUEUE_NAME}:retry`;
const FAILED_QUEUE_NAME = `${QUEUE_NAME}:failed`;
const STATS_KEY = `${QUEUE_NAME}:stats`;

// Types
interface NotificationPayload {
  id: string;
  scheduledAt: string;
  fcmToken: string;
  title: string;
  message: string;
  retryCount?: number;
  priority?: 'high' | 'normal' | 'low';
  metadata?: Record<string, any>;
}

interface WorkerStats {
  processed: number;
  failed: number;
  retried: number;
  startTime: number;
  lastActivity: number;
}

class NotificationWorker {
  private workerId: string;
  private isRunning = false;
  private stats: WorkerStats;
  private activeJobs = new Set<string>();

  constructor(workerId: string) {
    this.workerId = workerId;
    this.stats = {
      processed: 0,
      failed: 0,
      retried: 0,
      startTime: Date.now(),
      lastActivity: Date.now(),
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async sendNotification(
    token: string, 
    payload: { title: string; body: string },
    priority?: string
  ): Promise<boolean> {
    try {
      console.log(`📬 [${this.workerId}] Sending notification to token: ${token.substring(0, 10)}...`);
      
      const messagePayload: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        android: priority === 'high' ? {
          priority: 'high',
        } : undefined,
        apns: priority === 'high' ? {
          headers: {
            'apns-priority': '10',
          },
        } : undefined,
      };

      await messaging.send(messagePayload);
      console.log(`✅ [${this.workerId}] Notification sent successfully`);
      return true;
    } catch (error: any) {
      console.log(`❌ [${this.workerId}] Error sending notification:`, error.message);
      
      // Check if it's a recoverable error
      const recoverableErrors = ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'];
      if (recoverableErrors.some(err => error.code?.includes(err))) {
        return false; // Don't retry for invalid tokens
      }
      
      throw error; // Retry for other errors
    }
  }

  private async processNotification(notification: NotificationPayload): Promise<void> {
    const { id, scheduledAt, fcmToken, title, message, priority, retryCount = 0 } = notification;

    if (!fcmToken || !title || !message || !scheduledAt) {
      console.log(`❌ [${this.workerId}] Invalid notification data:`, { id, fcmToken: !!fcmToken, title: !!title, message: !!message, scheduledAt });
      await this.moveToFailed(notification, 'Invalid notification data');
      return;
    }

    const sendAt = new Date(scheduledAt).getTime();
    const now = Date.now();
    const waitTime = sendAt - now;

    // Check if notification is too far in the future
    if (waitTime > CONFIG.MAX_WAIT_TIME) {
      console.log(`⏭️ [${this.workerId}] Notification scheduled too far in future, requeueing: ${id}`);
      await redis.lpush(QUEUE_NAME, JSON.stringify(notification));
      return;
    }

    // Wait until scheduled time
    if (waitTime > 0) {
      console.log(`⏳ [${this.workerId}] Waiting ${waitTime}ms for notification: ${id}`);
      await this.delay(Math.min(waitTime, 60000)); // Max wait 1 minute at a time
      
      // Re-check if we should still send (in case of shutdown)
      if (!this.isRunning) return;
    }

    try {
      this.activeJobs.add(id);
      const success = await this.sendNotification(fcmToken, { title, body: message }, priority);
      
      if (success) {
        this.stats.processed++;
        this.stats.lastActivity = Date.now();
        console.log(`✅ [${this.workerId}] Processed notification: ${id}`);
      } else {
        await this.moveToFailed(notification, 'Invalid FCM token');
      }
    } catch (error: any) {
      console.log(`❌ [${this.workerId}] Error processing notification ${id}:`, error.message);
      await this.handleRetry(notification, error.message);
    } finally {
      this.activeJobs.delete(id);
    }
  }

  private async handleRetry(notification: NotificationPayload, error: string): Promise<void> {
    const retryCount = (notification.retryCount || 0) + 1;
    
    if (retryCount <= CONFIG.RETRY_ATTEMPTS) {
      console.log(`🔄 [${this.workerId}] Retrying notification ${notification.id} (attempt ${retryCount})`);
      
      const retryNotification = {
        ...notification,
        retryCount,
        scheduledAt: new Date(Date.now() + CONFIG.RETRY_DELAY * retryCount).toISOString(),
      };
      
      await redis.lpush(RETRY_QUEUE_NAME, JSON.stringify(retryNotification));
      this.stats.retried++;
    } else {
      console.log(`💀 [${this.workerId}] Max retries exceeded for notification: ${notification.id}`);
      await this.moveToFailed(notification, `Max retries exceeded: ${error}`);
    }
  }

  private async moveToFailed(notification: NotificationPayload, reason: string): Promise<void> {
    const failedNotification = {
      ...notification,
      failedAt: new Date().toISOString(),
      failureReason: reason,
    };
    
    await redis.lpush(FAILED_QUEUE_NAME, JSON.stringify(failedNotification));
    this.stats.failed++;
    console.log(`💀 [${this.workerId}] Moved to failed queue: ${notification.id} - ${reason}`);
  }

  private async fetchBatch(): Promise<NotificationPayload[]> {
    const notifications: NotificationPayload[] = [];
    
    // Try retry queue first
    for (let i = 0; i < CONFIG.BATCH_SIZE; i++) {
      const raw = await redis.rpop<string>(RETRY_QUEUE_NAME);
      if (!raw) break;
      
      try {
        notifications.push(JSON.parse(raw));
      } catch (error) {
        console.log(`❌ [${this.workerId}] Failed to parse retry notification:`, error);
      }
    }
    
    // Fill remaining slots from main queue
    const remaining = CONFIG.BATCH_SIZE - notifications.length;
    for (let i = 0; i < remaining; i++) {
      const raw = await redis.rpop<string>(QUEUE_NAME);
      if (!raw) break;
      
      try {
        const notification = JSON.parse(raw);
        // Add unique ID if not present
        if (!notification.id) {
          notification.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        notifications.push(notification);
      } catch (error) {
        console.log(`❌ [${this.workerId}] Failed to parse notification:`, error);
      }
    }
    
    return notifications;
  }

  private async updateStats(): Promise<void> {
    const statsData = {
      workerId: this.workerId,
      ...this.stats,
      activeJobs: this.activeJobs.size,
    };
    
    await redis.hset(STATS_KEY, { [this.workerId]: JSON.stringify(statsData) });
  }

  private async healthCheck(): Promise<void> {
    setInterval(async () => {
      if (this.isRunning) {
        await this.updateStats();
        console.log(`💓 [${this.workerId}] Health check - Processed: ${this.stats.processed}, Failed: ${this.stats.failed}, Active: ${this.activeJobs.size}`);
      }
    }, CONFIG.HEALTH_CHECK_INTERVAL);
  }

  async start(): Promise<void> {
    console.log(`🚀 [${this.workerId}] Starting notification worker`);
    this.isRunning = true;
    
    // Start health check
    this.healthCheck();
    
    while (this.isRunning) {
      try {
        const notifications = await this.fetchBatch();
        
        if (notifications.length === 0) {
          await this.delay(CONFIG.POLL_INTERVAL);
          continue;
        }
        
        console.log(`📦 [${this.workerId}] Processing batch of ${notifications.length} notifications`);
        
        // Process notifications in parallel with concurrency control
        const promises = notifications.map(notification => 
          this.processNotification(notification).catch(error => {
            console.log(`❌ [${this.workerId}] Unhandled error processing ${notification.id}:`, error);
          })
        );
        
        await Promise.allSettled(promises);
        
      } catch (error) {
        console.log(`❌ [${this.workerId}] Error in main loop:`, error);
        await this.delay(CONFIG.RETRY_DELAY);
      }
    }
    
    console.log(`🛑 [${this.workerId}] Worker stopped`);
  }

  async stop(): Promise<void> {
    console.log(`🛑 [${this.workerId}] Stopping worker...`);
    this.isRunning = false;
    
    // Wait for active jobs to complete
    while (this.activeJobs.size > 0) {
      console.log(`⏳ [${this.workerId}] Waiting for ${this.activeJobs.size} active jobs to complete...`);
      await this.delay(1000);
    }
    
    await this.updateStats();
    console.log(`✅ [${this.workerId}] Worker stopped gracefully`);
  }
}

// Worker Manager
class WorkerManager {
  private workers: NotificationWorker[] = [];
  private isShuttingDown = false;

  async start(): Promise<void> {
    console.log(`🎯 Starting ${CONFIG.CONCURRENT_WORKERS} notification workers`);
    
    // Create and start workers
    for (let i = 0; i < CONFIG.CONCURRENT_WORKERS; i++) {
      const worker = new NotificationWorker(`worker-${i + 1}`);
      this.workers.push(worker);
      
      // Start worker in background
      worker.start().catch(error => {
        console.log(`❌ Worker ${worker['workerId']} crashed:`, error);
      });
    }
    
    // Setup graceful shutdown
    this.setupGracefulShutdown();
    
    console.log(`✅ All workers started successfully`);
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      // Stop all workers
      const stopPromises = this.workers.map(worker => worker.stop());
      await Promise.all(stopPromises);
      
      console.log('✅ All workers stopped. Exiting...');
      process.exit(0);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  async getStats(): Promise<any> {
    const allStats = await redis.hgetall(STATS_KEY);
    return Object.entries(allStats ?? {}).reduce((acc, [workerId, statsJson]) => {
      try {
        acc[workerId] = JSON.parse(statsJson as string);
      } catch (error) {
        console.log(`❌ Failed to parse stats for ${workerId}:`, error);
      }
      return acc;
    }, {} as Record<string, any>);
  }
}

// Utility functions for queue management
export const queueUtils = {
  async getQueueSizes() {
    const [mainSize, retrySize, failedSize] = await Promise.all([
      redis.llen(QUEUE_NAME),
      redis.llen(RETRY_QUEUE_NAME),
      redis.llen(FAILED_QUEUE_NAME),
    ]);
    
    return {
      main: mainSize,
      retry: retrySize,
      failed: failedSize,
      total: mainSize + retrySize,
    };
  },

  async clearQueue(queueType: 'main' | 'retry' | 'failed' = 'main') {
    const queueName = queueType === 'main' ? QUEUE_NAME : 
                     queueType === 'retry' ? RETRY_QUEUE_NAME : FAILED_QUEUE_NAME;
    await redis.del(queueName);
  },

  async reprocessFailed(limit = 100) {
    const failed = [];
    for (let i = 0; i < limit; i++) {
      const raw = await redis.rpop<string>(FAILED_QUEUE_NAME);
      if (!raw) break;
      failed.push(raw);
    }
    
    if (failed.length > 0) {
      await redis.lpush(QUEUE_NAME, ...failed);
      console.log(`🔄 Requeued ${failed.length} failed notifications`);
    }
    
    return failed.length;
  }
};

// Start the worker manager
const manager = new WorkerManager();
manager.start().catch(error => {
  console.error('❌ Failed to start worker manager:', error);
  process.exit(1);
});

// Export for external use
export { WorkerManager, NotificationWorker, CONFIG };