import { logger } from "../config/logger";
import { messaging } from "../firebase/config";
import {NextApiResponse } from "next";
import { User , AuthenticatedRequest} from "@/lib/models/user.model";


async function sendNotification(token: string, payload: { title: string, body: string }) {
  try {
    logger.info('📬 Sending notification to token:', token);
    await messaging.send({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
    });
    logger.info('✅ Notification sent successfully');
  } catch (error) {
    logger.error('❌ Error sending notification:', error);
  }
}


const sendNotificationToUser = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const user = req.user;
    if(!user){
      logger.error('❌ User not authenticated');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const {title, message} = req.body;
    if (!title || typeof title !== 'string' || !message || typeof message !== 'string') {
      logger.error('❌ Invalid message parameter');
      return res.status(400).json({ error: 'Bad Request: Invalid message parameter' });
    }
    const currentUser = await User.findOne({ email: user.email });
    if (!currentUser || !currentUser.fcmToken) {
      logger.error('❌ User not found or FCM token missing');
      return res.status(404).json({ error: 'User not found or FCM token missing' });
    }
    const payload = {
      title: title,
      body: message,
    };
    await sendNotification(currentUser.fcmToken, payload);
    logger.info('✅ Notification sent successfully');
    return res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    logger.error('❌ Error in sendNotificationToUser:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


export {
  sendNotification,
  sendNotificationToUser
}