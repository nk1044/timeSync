import { Schema, model, models } from "mongoose";
import type { NextApiRequest } from "next";

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    email: string;
  };
}

export interface IUser {
    _id: string;
    name: string;
    email: string;
    image?: string;
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

}, {timestamps: true});

if (process.env.NODE_ENV !== "development") {
    delete models.User;
}

export const User = models.User || model("User", UserSchema);
