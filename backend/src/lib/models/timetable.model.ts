import { Schema, Types, model } from "mongoose";

const TimeTableSchema = new Schema({
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
        enum: ['PRIMARY', 'SECONDARY'],
        default: 'SECONDARY',
    },
    lifetime:{
        type: Date,
        required: true,
    },
    standardWeek:{
        type: Types.ObjectId,
        ref: 'Week',
        required: true,
    },
    ongoingWeek:{
        type: Types.ObjectId,
        ref: 'Week',
        required: true,
    },
    history: [{
        date: {type:Date, required: true},
        week: {type: Types.ObjectId, ref: 'Week', required: true},
    }],

}, { timestamps: true });

export const TimeTable = model('TimeTable', TimeTableSchema);