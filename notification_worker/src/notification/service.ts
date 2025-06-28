import {messaging} from '../config/firebase';


const sendNotification = async (token: string, payload: { title: string; body: string }) => {
  try {
    console.log(`📬 Sending: "${payload.title}"`);
    await messaging.send({ 
      token:token, 
      notification: payload,
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        type: 'custom',
      },
    });
    console.log('✅ Sent successfully');
  } catch (error) {
    console.error('❌ Sending failed:', error);
  }
};


export { 
    sendNotification,
};