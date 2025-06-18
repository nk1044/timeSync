import { Schema, model } from "mongoose";

const TodoSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        required: true,
        enum: ['EVENT', 'PERSONAL', 'TASK'],
        default: 'PERSONAL'
    },
    reminder: {
        type: Date,
    },
    tag: {
        type: String,
        enum: ['important', 'casual'],
        default: 'casual' 
    }
}, { timestamps: true });

export const Todo = model('Todo', TodoSchema);