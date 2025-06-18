import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/config/db";
import {User } from "@/lib/models/user.model";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
  async signIn({ profile }) {
    if (!profile) return false;

    await connectDB();

    const userExists = await User.findOne({ email: profile.email });
    if (!userExists) {
      await User.create({
        name: profile.name,
        email: profile.email,
        image: profile.image,
      });
    }

    return true;
  },
  },
});
