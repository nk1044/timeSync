import { Notification } from "../models/notification.model";

const createNotification = async ({
    title,
    message,
    type,
    eventId='',
    todoId='',
    scheduledAt,
    userId='',
    repeatDay = 0,
    status = 'pending',
}: {title:string, message:string, type:string, eventId:string,todoId:string, scheduledAt:Date, userId:string, repeatDay:number, status:string }) => {
  try {
    if(!title || !type || !userId) {
      throw new Error("Title, type, and userId are required fields.");
      return null;
    }
    const notification = await Notification.create({
      title,
      message,
      type,
      eventId,
      todoId,
      scheduledAt,
      userId,
      repeatDay,
      status,
    });
    if(!notification) {
      throw new Error("Failed to create notification.");
      return null;
    }
    return notification;
  } catch (error) {
    throw new Error(`Error creating notification: ${error}`);
    return null;
  }
}

export {
    createNotification,
}