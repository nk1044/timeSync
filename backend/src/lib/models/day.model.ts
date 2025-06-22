import { Schema, Types, model, models, Document } from "mongoose";

export interface IDay extends Document {
  _id: Types.ObjectId;
  name: | "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
  date: string;
  events: {
    event: Types.ObjectId;
    startTime: string;
    endTime: string;
    reminderTime?: number;
  }[];
  owner: Types.ObjectId; // Reference to User
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
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
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


export interface NormalizeDateOnly {
  (date: Date | string): string;
}

export const normalizeDateOnly: NormalizeDateOnly = function(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  return d.toISOString().split("T")[0]; // returns "YYYY-MM-DD"
};


DaySchema.pre<IDay>("save", function (next) {
  this.name = this.name.toUpperCase() as IDay["name"];
  this.date = normalizeDateOnly(this.date);
  next();
});

if (process.env.NODE_ENV === "development") {
  delete models.Day;
}

export const Day = models.Day || model<IDay>("Day", DaySchema);
