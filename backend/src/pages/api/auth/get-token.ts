import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get the JWT token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return res.status(401).json({ error: "No token found" });
    }

    res.status(200).json({ 
      // This is the raw JWT token you can use in Authorization header
      token: req.cookies['next-auth.session-token'] || req.cookies['__Secure-next-auth.session-token'],
      user: {
        email: session.user.email,
        id: session.user.id,
        name: session.user.name,
        image: session.user.image,
      }
    });
  } catch (error) {
    console.error("Get token error:", error);
    res.status(500).json({ error: "Failed to get token" });
  }
}