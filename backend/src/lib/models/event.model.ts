import { Schema, Types, model } from "mongoose";

const EventSchema = new Schema({
    title: {
        type: String,
        required: true,
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
    ]
}, { timestamps: true });

export const Event = model('Event', EventSchema);