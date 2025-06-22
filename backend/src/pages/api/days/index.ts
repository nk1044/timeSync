import { connectDB } from "@/lib/config/db";
import type { NextApiResponse } from "next";
import {getDayByDate} from "@/lib/controllers/day.controller";
import { withAuth } from "@/lib/middleware/authMiddleware";
import { AuthenticatedRequest } from "@/lib/models/user.model";

export default withAuth(async function handler(
    req: AuthenticatedRequest,
    res: NextApiResponse,
) {
    try {
        await connectDB();

        switch (req.method) {
            case "GET":
                return await getDayByDate(req, res);
            default:
                res.setHeader("Allow", ["GET"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error in API handler:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
