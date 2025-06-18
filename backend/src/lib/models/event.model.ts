import { Schema, Types, model, models } from "mongoose";

const EventSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    tag: {
        type: String,
        required: true,
        enum: ['CLASS', 'PERSONAL'],
        default: 'CLASS'
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    notes: [
        {
            type: Types.ObjectId,
            ref: 'Todo'
        }
    ],
    owner: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    },
}, { timestamps: true });

if (process.env.NODE_ENV === "development") {
  delete models.Event;
}

export const Event = models.Event || model('Event', EventSchema);