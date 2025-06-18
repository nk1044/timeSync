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

export const Week = models.Week || model<IWeek>('Week', WeekSchema);
