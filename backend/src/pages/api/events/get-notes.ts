import { connectDB } from "@/lib/config/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { getTodosOfEvent, updateEvent, deleteEvent } from "@/lib/controllers/event.controller";
import { withAuth } from "@/lib/middleware/authMiddleware";
import { AuthenticatedRequest } from "@/lib/models/user.model";

export default withAuth(async function handler(
    req: AuthenticatedRequest,
    res: NextApiResponse
) {
    try {
        await connectDB();
        switch (req.method) {
            case "GET":
                return await getTodosOfEvent(req, res);
            case "PUT":
                return await updateEvent(req, res);
            case "DELETE":
                return await deleteEvent(req, res);
            default:
                res.setHeader("Allow", ["GET"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error in API handler:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
