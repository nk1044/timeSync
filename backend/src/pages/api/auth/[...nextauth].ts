// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Session } from "next-auth";

// Extend the Session type to include user.id
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }: { session: import("next-auth").Session; token: any }) {
      if (session.user) {
        session.user.id = token.sub; // If you want userId later
      }
      return session;
    },
    async jwt({
      token,
      account,
      user,
    }: {
      token: any;
      account?: any;
      user?: any;
    }) {
      return token;
    },
  },
};

export default NextAuth(authOptions);
