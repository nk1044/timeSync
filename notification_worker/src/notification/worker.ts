import { sendNotification } from './service';
import { Notification } from '../models/notification.model';
import { User, IUser } from '../models/user.model';
import { Request, Response } from 'express';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const processNextNotification = async () => {
  try {
    const nextNotification = await Notification
      .findOne({ status: 'pending' })
      .sort({ scheduledAt: 1, priority: -1 });

    if (!nextNotification) {
      console.log('ℹ️ No pending notifications found.');
      return;
    }

    // Get current time in IST (UTC + 5:30)
    const nowUTC = new Date();
    const nowIST = new Date(nowUTC.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5:30 hours
    
    // The scheduledAt is stored in IST, so treat it as local IST time
    const scheduledTimeIST = new Date(nextNotification.scheduledAt);
    
    console.log(`📦 Raw scheduledAt:    ${nextNotification.scheduledAt}`);
    console.log(`🕒 Now IST:           ${nowIST.toISOString().replace('T', ' ').slice(0, 19)} IST`);
    console.log(`📅 Scheduled IST:     ${scheduledTimeIST.toISOString().replace('T', ' ').slice(0, 19)} IST`);
    
    const waitTime = scheduledTimeIST.getTime() - nowIST.getTime();
    console.log(`⏳ Calculated wait time: ${waitTime}ms`);
    
    // Better time display
    const hours = Math.floor(waitTime / (60_000 * 60));
    const minutes = Math.floor((waitTime % (60_000 * 60)) / 60_000);
    const seconds = Math.floor((waitTime % 60_000) / 1000);
    console.log(`⏳ Time breakdown: ${hours}h ${minutes}m ${seconds}s`);

    if (waitTime <= 0) {
      console.log(`⚡ Processing overdue or immediate notification`);
    } else {
      // Add a safety check for unreasonably long wait times
      const maxWaitTime = 24 * 60 * 60 * 1000; // 24 hours
      if (waitTime > maxWaitTime) {
        console.log(`⚠️ Wait time too long (${Math.floor(waitTime / 60000)}m). Skipping.`);
        return;
      }
      
      console.log(`⏳ Waiting ${Math.floor(waitTime / 60000)}m ${Math.floor((waitTime % 60000) / 1000)}s...`);
      await delay(waitTime);
    }

    // Confirm it's still pending
    const confirmedNotification = await Notification.findById(nextNotification._id);
    if (!confirmedNotification || confirmedNotification.status !== 'pending') {
      console.log('ℹ️ Notification was already processed.');
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