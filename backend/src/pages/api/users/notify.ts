import { connectDB } from "@/lib/config/db";
import {sendNotification} from "@/lib/notification/service";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });
    await connectDB();
    const { token, title, body } = req.body;
    if (!token || !title || !body) {
        return res.status(400).json({ message: "Missing token, title or body" });
    }

    try {
        await sendNotification(token, { title, body });
        return res.status(200).json({ message: "✅ Notification sent" });
    } catch (error) {
        console.error("❌ Notification error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
