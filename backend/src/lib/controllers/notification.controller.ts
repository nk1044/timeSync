import { Notification } from "../models/notification.model";

const createNotification = async ({
    title,
    message,
    type,
    dayId='',
    eventId='',
    todoId='',
    scheduledAt,
    userId='',
    repeatDay = 0,
    status = 'pending',
}: {title:string, message:string, type:string, dayId:string, todoId:string, eventId:string, scheduledAt:Date, userId:string, repeatDay:number, status:string }) => {
  try {
    if(!title || !type || !userId) {
      throw new Error("Title, type, and userId are required fields.");
      return null;
    }
    const notification = await Notification.create({
      title:title,
      message:message,
      type:type,
      dayId:dayId,
      eventId: eventId,
      todoId: todoId,
      scheduledAt: scheduledAt,
      userId: userId,
      repeatDay: repeatDay,
      status: status,
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