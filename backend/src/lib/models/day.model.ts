import { Schema, Types, model, models, Document } from "mongoose";

interface IEventEntry {
    event: Types.ObjectId;
    startTime: Date;
    endTime: Date;
    reminderTime?: number;
}

export interface IDay extends Document {
    name: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
    date: Date;
    events: IEventEntry[];
    createdAt?: Date;
    updatedAt?: Date;
}

// Helper function to convert "HH:MM" string to Date with 1970-01-01
function timeStringToDate(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(1970, 0, 1, hours, minutes);
}

const EventEntrySchema = new Schema<IEventEntry>({
    event: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    startTime: {
        type: Date,
        required: true,
        get: (v: unknown) => {
            const date = v instanceof Date ? v : new Date(v as string);
            return date.toISOString().slice(11, 16); // HH:MM
        },
        set: (v: unknown) => {
            if (typeof v === 'string') {
                const [hours, minutes] = v.split(':').map(Number);
                return new Date(1970, 0, 1, hours, minutes);
            }
            return v;
        },
    } as any,
    endTime: {
        type: Date,
        required: true,
        validate: {
            validator: function (this: IEventEntry, value: Date) {
                return value > this.startTime;
            },
            message: (props: any) => `End time (${props.value}) must be after start time!`,
        },
        get: (v: unknown) => {
            const date = v instanceof Date ? v : new Date(v as string);
            return date.toISOString().slice(11, 16); // HH:MM
        },
        set: (v: unknown) => {
            if (typeof v === 'string') {
                return timeStringToDate(v);
            }
            return v;
        },
    } as any,
    reminderTime: {
        type: Number,
    },
});

const DaySchema = new Schema<IDay>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            enum: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
            default: 'SUNDAY',
        },
        date: {
            type: Date,
            required: true,
            default: () => {
                const now = new Date();
                now.setUTCHours(0, 0, 0, 0);
                return now;
            },
        },
        events: {
            type: [EventEntrySchema],
            default: [],
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    }
);

export const Day = models.Day || model<IDay>('Day', DaySchema);

// await Day.create({
//   name: 'MONDAY',
//   date: new Date('2025-06-23T00:00:00.000Z'),
//   events: [
//     {
//       event: someEventId,
//       startTime: '09:30',
//       endTime: '10:30',
//       reminderTime: 15,
//     },
//   ],
// });
