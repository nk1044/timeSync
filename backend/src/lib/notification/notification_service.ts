import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL as string,
    token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
})


export const putNotificationInQueue = async (notification: any) => {
    const QueueName = process.env.UPSTASH_REDIS_QUEUE as string;
    try {
        await redis.lpush(QueueName, JSON.stringify(notification));
        console.log('Notification added to queue:', notification);
    } catch (error) {
        console.error('Error adding notification to queue:', error);
    }
}
