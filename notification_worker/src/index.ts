import 'dotenv/config';
import mongoose, { Schema, model, models } from 'mongoose';
import admin from 'firebase-admin';

// 🔷 MongoDB Setup
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// 🔷 Notification Schema
const NotificationSchema = new Schema({
  title: { type: String, required: true },
  message: { type: String },
  type: { type: String, enum: ['EVENT', 'PERSONAL', 'TODO'], required: true },
  priority: { type: Number, default: 1, min: 1, max: 5 },
  dayId: { type: Schema.Types.ObjectId, ref: 'Day' },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
  todoId: { type: Schema.Types.ObjectId, ref: 'Todo' },
  scheduledAt: { type: Date, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  repeatDay: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
}, { timestamps: true });

if (process.env.NODE_ENV === 'development') delete models.Notification;
const Notification = models.Notification || model('Notification', NotificationSchema);

// 🔷 Minimal User Schema (for FCM Token)
// 🔷 Minimal User Schema (for FCM token only)
const UserSchema = new Schema({
  fcmToken: { type: String },
}, { timestamps: true });

if (process.env.NODE_ENV === 'development') {
  delete models.User;
}
const User = models.User || model('User', UserSchema);


// 🔷 Firebase Setup
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    }),
  });
}
const messaging = admin.messaging();

// 🔁 Delay Utility
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// 🔔 Send FCM Notification
const sendNotification = async (token: string, payload: { title: string; body: string }) => {
  try {
    console.log(`📬 Sending: "${payload.title}"`);
    await messaging.send({ token, notification: payload });
    console.log('✅ Sent successfully');
  } catch (error) {
    console.error('❌ Sending failed:', error);
  }
};

// 🧠 Main Worker Loop
const startNotificationWorker = async () => {
  while (true) {
    try {
      const nowUTC = new Date();
      const upcoming = await Notification.find({
        status: 'pending',
        scheduledAt: { $gte: nowUTC },
      });

      if (upcoming.length === 0) {
        console.log('🕐 No pending notifications. Waiting for 5 minutes...');
        await delay(5*60_000); // 5 minute
        continue;
      }

      // Sort manually by time then priority
      const sorted = upcoming.sort((a, b) => {
        const timeDiff = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        return timeDiff !== 0 ? timeDiff : b.priority - a.priority;
      });
      const test = sorted[0];
      const scheduledAtTime = new Date(test.scheduledAt).getTime();
      const nowTime = nowUTC.getTime();
      const tenMinutesInMs = 10 * 60 * 1000;

      if (scheduledAtTime - nowTime > tenMinutesInMs) {
        console.log(`⏸ Scheduled time is more than 10 minutes away. Waiting for 5 minutes before rechecking.`);
        await delay(5*60_000); // wait 5 minute before next check
        continue;
      }
      const nextNotification = sorted[0];
      const waitTime = new Date(nextNotification.scheduledAt).getTime() - nowUTC.getTime();

      if (waitTime > 0) {
        const minutes = Math.floor(waitTime / 60_000);
        const seconds = Math.floor((waitTime % 60_000) / 1000);
        console.log(`⏳ Waiting ${minutes}m ${seconds}s for ${nextNotification.scheduledAt.toISOString()}`);
        await delay(waitTime);
      } else {
        console.log('⏱ Scheduled time reached. Sending now...');
      }

      // Fetch user
      interface UserLeanDoc {
        _id: unknown;
        fcmToken?: string;
        [key: string]: any;
      }
      const user = await User.findById(nextNotification.userId).lean() as UserLeanDoc | null;
      if (!user?.fcmToken) {
        console.error('❌ Missing FCM token. Marking as failed.');
        await Notification.findByIdAndUpdate(nextNotification._id, { status: 'failed' });
        continue;
      }

      await sendNotification(user.fcmToken, {
        title: nextNotification.title,
        body: nextNotification.message || '',
      });

      await Notification.findByIdAndUpdate(nextNotification._id, { status: 'sent' });

    } catch (err) {
      console.error('❌ Error in worker loop:', err);
    }
 
    await delay(1_000); // Short pause before next check
  }
};

startNotificationWorker();
