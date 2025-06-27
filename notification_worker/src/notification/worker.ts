import { sendNotification } from './service';
import { Notification } from '../models/notification.model';
import { User, IUser } from '../models/user.model';
import { Request, Response } from 'express';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const processNextNotification = async () => {
  try {
    const nowUTC = new Date();

    const nextNotification = await Notification
      .findOne({ status: 'pending', scheduledAt: { $gte: nowUTC } })
      .sort({ scheduledAt: 1, priority: -1 });

    if (!nextNotification) {
      console.log('ℹ️ No pending notifications found.');
      return;
    }

    const waitTime = new Date(nextNotification.scheduledAt).getTime() - nowUTC.getTime();
    const tenMinutesInMs = 10 * 60 * 1000;

    if (waitTime > tenMinutesInMs) {
      console.log(`⏸ Notification is >10min away: ${nextNotification.scheduledAt.toISOString()}`);
      return;
    }

    if (waitTime > 0) {
      const minutes = Math.floor(waitTime / 60_000);
      const seconds = Math.floor((waitTime % 60_000) / 1000);
      console.log(`⏳ Waiting ${minutes}m ${seconds}s...`);
      await delay(waitTime);
    }
    const confirmedNotification = await Notification.findById(nextNotification._id);
    if (!confirmedNotification || confirmedNotification.status !== 'pending') {
      console.log('ℹ️ Notification was updated or processed by another worker.');
      return;
    }
    const user = await User.findById(nextNotification.userId).lean() as IUser | null;
    if (!user?.fcmToken) {
      await Notification.findByIdAndUpdate(nextNotification._id, { status: 'failed' });
      console.log('❌ Missing FCM token. Marked as failed.');
      return;
    }

    await sendNotification(user.fcmToken, {
      title: nextNotification.title,
      body: nextNotification.message || '',
    });

    await Notification.findByIdAndUpdate(nextNotification._id, { status: 'sent' });
    console.log(`✅ Notification ${nextNotification._id} sent successfully.`);
  } catch (err) {
    console.error('❌ Error in background worker:', err);
  }
};



const startNotificationWorker = async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (token !== process.env.WORKER_TOKEN) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    processNextNotification(); // Fire and forget
    return res.status(200).json({ message: '🔁 Worker started in background.' });
  } catch (err) {
    console.error('❌ Error in worker trigger:', err);
    return res.status(500).json({ message: '❌ Failed to trigger worker.' });
  }
};



export {
    startNotificationWorker,
}