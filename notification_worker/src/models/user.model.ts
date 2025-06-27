// models/user.model.ts
import mongoose, { Schema, model, models, Document } from 'mongoose';

interface IUser {
  fcmToken?: string;
}

const UserSchema = new Schema<IUser>({
  fcmToken: { type: String },
});

const User = models.User || model<IUser & Document>('User', UserSchema);

export { User, IUser };
