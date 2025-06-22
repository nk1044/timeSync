import { connectDB } from "@/lib/config/db";
import type { NextApiResponse } from "next";
import { withAuth } from "@/lib/middleware/authMiddleware";
import type { AuthenticatedRequest } from "@/lib/models/user.model";
import { removeEventFromDay } from "@/lib/controllers/week.controller";

export default withAuth(
    async function handler(
    req: AuthenticatedRequest,
    res: NextApiResponse
) {
    try {
        await connectDB();
        
        switch (req.method) {
            case "DELETE":
                return await removeEventFromDay(req, res);
            default:
                res.setHeader("Allow", ["DELETE"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error in API handler:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
