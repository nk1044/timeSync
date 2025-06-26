import { connectDB } from "@/lib/config/db";
import {sendNotificationToUser} from "@/lib/notification/service";
import type {NextApiResponse } from "next";
import { AuthenticatedRequest } from "@/lib/models/user.model";
import { withAuth } from "@/lib/middleware/authMiddleware";

export default withAuth(
    async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    await connectDB();
    try {
        await connectDB();
        switch (req.method) {
            case "POST":
                return await sendNotificationToUser(req, res);
            default:
                res.setHeader("Allow", ["POST"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("❌ Notification error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})
