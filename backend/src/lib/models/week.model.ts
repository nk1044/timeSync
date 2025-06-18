import { Schema, Types, model, models, Document } from "mongoose";

interface IWeek extends Document {
  metadata?: string;
  days: Types.ObjectId[];
}

const WeekSchema = new Schema<IWeek>({
  metadata: {
    type: String,
    trim: true,
    default: 'Week Metadata',
  },
  days: [{
    type: Schema.Types.ObjectId,
    ref: 'Day',
    required: true,
  }],
}, { timestamps: true });

if (process.env.NODE_ENV === "development") {
  delete models.Week;
}

export const Week = models.Week || model<IWeek>('Week', WeekSchema);
