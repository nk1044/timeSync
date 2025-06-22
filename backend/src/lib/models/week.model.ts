import { Schema, Types, model, models, Document } from "mongoose";

const WeekSchema = new Schema({
  metadata: {
    type: String,
    trim: true,
    default: 'Week Metadata',
  },
  SUNDAY: {
    events: [{
      event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      reminderTime: { type: Number, default: null }
    }],
  },
  MONDAY: {
    events: [{
      event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      reminderTime: { type: Number, default: null }
    }],
  },
  TUESDAY: {
    events: [{
      event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      reminderTime: { type: Number, default: null }
    }],
  },
  WEDNESDAY: {
    events: [{
      event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      reminderTime: { type: Number, default: null }
    }],
  },
  THURSDAY: {
    events: [{
      event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      reminderTime: { type: Number, default: null }
    }],
  },
  FRIDAY: {
    events: [{
      event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      reminderTime: { type: Number, default: null }
    }],
  },
  SATURDAY: {
    events: [{
      event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      reminderTime: { type: Number, default: null }
    }],
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

if (process.env.NODE_ENV === "development") {
  delete models.Week;
}

export const Week = models.Week || model('Week', WeekSchema);
