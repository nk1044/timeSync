import { Schema, model, models } from "mongoose";
import type { NextApiRequest } from "next";

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    email: string;
  };
}

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
    },
    image:{
        type: String,
        trim: true,
    },
    todos:[
        {
            type: Schema.Types.ObjectId,
            ref: "Todo",
        }
    ],
    fcmToken: {
        type: String,
        trim: true,
    },
    timeTables:[
        {
            type: Schema.Types.ObjectId,
            ref: "TimeTable",
        }
    ],

}, {timestamps: true});

if (process.env.NODE_ENV !== "development") {
    delete models.User;
}

export const User = models.User || model("User", UserSchema);
