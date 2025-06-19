import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";
import { connectDB } from "@/lib/config/db";
import { User } from "@/lib/models/user.model";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB(); // Ensure DB is connected

    const { accessToken, idToken } = req.body;
    console.log("🔐 Mobile auth request received");

    if (!idToken) {
      return res.status(400).json({ error: "Missing ID token" });
    }

    // ✅ Verify token via Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ error: "Invalid token: missing email" });
    }

    // ✅ Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name: name || "Unnamed User",
        image: picture || "",
      });
      console.log("🆕 New user created:", email);
    } else {
      console.log("✅ Existing user logged in:", email);
    }

    // ✅ Sign JWT for mobile client
    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "7d" }
    );

    // ✅ Send token + user back to mobile app
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    console.error("❌ Error during mobile auth:", error);
    return res.status(500).json({ error: "Server error during authentication" });
  }
}
