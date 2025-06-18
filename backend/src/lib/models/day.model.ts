import { Schema, Types, model, models, Document } from "mongoose";

export interface IDay extends Document {
  name: | "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
  date: Date;
  events: {
    event: Types.ObjectId;
    startTime: string;
    endTime: string;
    reminderTime?: number;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}


const DaySchema = new Schema<IDay>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      enum: [ "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
      ],
      default: "SUNDAY",
    },
    date: {
      type: Date,
      required: true,
    },
    events: {
      type: [
        {
          event: {type: Schema.Types.ObjectId, ref: "Event", required: true,},
          startTime: {type: String, required: true,},
          endTime: {type: String, required: true,},
          reminderTime: {type: Number,},
        },
      ],
      default: [],
    },
  },{timestamps: true,});

const normalizeTime = (value: string): string => {
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(11, 16);
    }
  } catch {
    console.log("Invalid date format, using default time.");
  }
  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  return "09:00";
};


DaySchema.pre<IDay>("save", function (next) {
  this.name = this.name.toUpperCase() as IDay["name"];
  next();
});

if (process.env.NODE_ENV === "development") {
  delete models.Day;
}

export const Day = models.Day || model<IDay>("Day", DaySchema);
