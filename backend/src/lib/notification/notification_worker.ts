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

    // Delay until scheduledAt
    const now = Date.now();
    const waitTime = new Date(scheduledAt).getTime() - now;
    if (waitTime > 0) {
      logger.info(`⏳ Waiting ${waitTime}ms to send notification ${_id}`);
      await delay(waitTime);
    }

    // Double check the time has come
    if (new Date() < new Date(scheduledAt)) {
      logger.warn(`⚠️ Skipping notification ${_id} - scheduledAt still in the future`);
      return;
    }

    // Send FCM notification
    await sendNotification(user.fcmToken, {
      title,
      body: message,
    });

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
        type: notificationDoc.type ?? '',
        dayId: notificationDoc.dayId ?? '',
        eventId: notificationDoc.eventId ?? '',
        todoId: notificationDoc.todoId ?? '',
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

      const nextNotification = await Notification.findOne({
        status: 'pending',
        scheduledAt: { $gte: now }, // upcoming only
      })
        .sort({ scheduledAt: 1, priority: -1 }); // strict time first, then priority

      if (!nextNotification) {
        logger.info('🔕 No upcoming notifications found. Rechecking in 30s...');
        await delay(30 * 1000);
        continue;
      }

      const waitTime = new Date(nextNotification.scheduledAt).getTime() - Date.now();

      if (waitTime > 0) {
        logger.info(`⏳ Next notification (${nextNotification._id}) scheduled in ${waitTime}ms`);
        await delay(waitTime);
      }

      // Send only one at a time
      await sendNotificationToUser(nextNotification);
    } catch (error) {
      logger.error('❌ Error in notification loop:', error);
      await delay(10 * 1000); // retry sooner if error
    }
  }
};

export {
  processNotifications,
  sendNotificationToUser,
};
