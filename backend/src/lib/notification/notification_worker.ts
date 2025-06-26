// notification_worker.ts

import { logger } from "../config/logger";
import { Notification } from "../models/notification.model";
import { User } from "../models/user.model";
import { sendNotification } from './service';
import { createNotification } from "../controllers/notification.controller";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sendNotificationToUser = async (notificationDoc: any) => {
  try {
    const { _id, userId, title, message, scheduledAt, repeatDay } = notificationDoc;

    if (!userId || !title || !message) {
      logger.error('❌ Missing required fields for notification:', _id);
      return;
    }

    const user = await User.findById(userId);
    if (!user || !user.fcmToken) {
      logger.error('❌ User not found or FCM token missing for userId:', userId);
      return;
    }

    // Delay if scheduledAt is in the future
    const now = Date.now();
    const waitTime = new Date(scheduledAt).getTime() - now;
    if (waitTime > 0) {
      logger.info(`⏳ Waiting ${waitTime}ms to send notification ${_id}`);
      await delay(waitTime);
    }

    // Send FCM notification
    await sendNotification(user.fcmToken, {
      title,
      body: message,
    });

    // Mark current notification as sent
    notificationDoc.status = 'sent';
    await notificationDoc.save();

    logger.info(`✅ Notification sent to ${user.email || user._id}`);

    // Handle repeat
    if (repeatDay && repeatDay > 0) {
      const nextScheduledAt = new Date(new Date(scheduledAt).getTime() + repeatDay * 24 * 60 * 60 * 1000);

      const nextNotification = {
        userId,
        title,
        message,
        type: notificationDoc.type ?? '', // Provide a default or copy from original
        eventId: notificationDoc.eventId ?? '', // Provide a default or copy from original
        todoId: notificationDoc.todoId ?? '', // Provide a default or copy from original
        scheduledAt: nextScheduledAt,
        repeatDay,
        priority: notificationDoc.priority ?? 1,
        status: 'pending',
      };

      const created = await createNotification(nextNotification);
      logger.info(`🔁 Scheduled next repeat notification (every ${repeatDay} days):`, created._id);
    }
  } catch (error) {
    logger.error(`❌ Failed to send notification ${notificationDoc?._id}:`, error);

    // Mark as failed
    if (notificationDoc) {
      notificationDoc.status = 'failed';
      await notificationDoc.save();
    }
  }
};


const processNotifications = async () => {
  while (true) {
    try {
      const now = new Date();

      const notifications = await Notification.find({
        status: 'pending',
        scheduledAt: { $lte: new Date(Date.now() + 5 * 60 * 1000) }, // fetch 5 mins ahead
      }).sort({ priority: -1, scheduledAt: 1 });

      if (notifications.length === 0) {
        logger.info('🔕 No pending notifications to process. Waiting...');
      } else {
        logger.info(`📦 Found ${notifications.length} notifications. Starting parallel dispatch...`);

        await Promise.all(
          notifications.map((notification) => sendNotificationToUser(notification))
        );
      }
    } catch (error) {
      logger.error('❌ Error in processNotifications loop:', error);
    }

    // Wait 5 minutes before next cycle
    await delay(5 * 60 * 1000);
  }
};

export {
  processNotifications,
  sendNotificationToUser,
};
