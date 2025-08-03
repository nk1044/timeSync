import { Schema, model, models } from "mongoose";

const ExceptionCardSchema = new Schema({
  EventRoutine: {
    type: Schema.Types.ObjectId,
    ref: "RoutineCard",
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
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }
}, { timestamps: true });

export const ExceptionCard = models.ExceptionCard || model("ExceptionCard", ExceptionCardSchema);
