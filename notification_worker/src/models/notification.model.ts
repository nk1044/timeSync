import { Schema, models, model } from "mongoose";


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
export const Notification = models.Notification || model('Notification', NotificationSchema);
