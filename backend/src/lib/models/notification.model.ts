import { Schema, models, model } from "mongoose";

const NotificationSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['EVENT', 'PERSONAL', 'TASK'],
        default: 'EVENT'
    },
    priority:{
        type: Number,
        default: 1, // Default priority
        min: 1, // Minimum priority value
        max: 5 // Maximum priority value
    },
    eventId: {
        type: Schema.Types.ObjectId,
        ref: "Event",
    },
    todoId: {
        type: Schema.Types.ObjectId,
        ref: "Todo",
    },
    scheduledAt: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    repeatDay:{
        type: Number,
        default: 0,
    },
    status: { 
        type: String, 
        enum: ['pending', 'sent', 'failed'], 
        default: 'pending' 
    },
}, {timestamps: true,});


if (process.env.NODE_ENV === "development") {
    delete models.Notification;
}

export const Notification = models.Notification || model('Notification', NotificationSchema);