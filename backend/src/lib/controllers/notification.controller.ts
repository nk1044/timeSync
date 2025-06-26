import { Notification } from "../models/notification.model";

const createNotification = async ({
  title,
  message,
  type,
  dayId,
  eventId,
  todoId,
  scheduledAt,
  userId,
  repeatDay = 0,
  status = 'pending',
}: {
  title: string;
  message: string;
  type: string;
  dayId?: string;
  todoId?: string;
  eventId?: string;
  scheduledAt: Date;
  userId: string;
  repeatDay?: number;
  status?: string;
}) => {
  try {
    if (!title || !type || !userId) {
      throw new Error("Title, type, and userId are required fields.");
    }

    const data: Record<string, any> = {
      title,
      message,
      type,
      scheduledAt,
      userId,
      repeatDay,
      status,
    };

    // 🛡️ Only add ObjectIds if non-empty
    if (dayId && dayId.trim() !== "") data.dayId = dayId;
    if (eventId && eventId.trim() !== "") data.eventId = eventId;
    if (todoId && todoId.trim() !== "") data.todoId = todoId;

    const notification = await Notification.create(data);

    if (!notification) {
      throw new Error("Failed to create notification.");
    }

    return notification;
  } catch (error) {
    throw new Error(`Error creating notification: ${error}`);
  }
};

export {
  createNotification,
};
