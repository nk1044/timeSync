import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  image: String,
});

if (process.env.NODE_ENV !== "development") {
  delete models.User;
}

export const User = models.User || model("User", UserSchema);
