import { Schema, model, models } from "mongoose";

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
        required: true,
        enum: ['IMPORTANT', 'NOT_IMPORTANT'],
        default: 'NOT_IMPORTANT' 
    }
}, { timestamps: true });


if (process.env.NODE_ENV === "development") {
    delete models.Todo;
}

export const Todo = models.Todo || model('Todo', TodoSchema);