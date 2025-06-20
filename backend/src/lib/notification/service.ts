import { logger } from "../config/logger";
import { messaging } from "../firebase/config";


export async function sendNotification(token: string, payload: { title: string, body: string }) {
  try {
    await messaging.send({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
    });
  } catch (error) {
    logger.error('❌ Error sending notification:', error);
  }
}