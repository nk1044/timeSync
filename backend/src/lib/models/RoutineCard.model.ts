import { Schema, model, models } from "mongoose";


const RoutineCardSchema = new Schema({
  Event: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  Day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true,
  },
  Frequency: {
    type: String,
    enum: ["daily", "weekly"],
    required: true,
  },
  Exception: {
    type: Schema.Types.ObjectId,
    ref: "ExceptionCard",
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }
}, { timestamps: true });

export const RoutineCard = models.RoutineCard || model("RoutineCard", RoutineCardSchema);
