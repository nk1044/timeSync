import {NextApiResponse } from "next";
import { withAuth } from "@/lib/middleware/authMiddleware";
import { AuthenticatedRequest } from "@/lib/models/user.model";
import { getRoutinesForDate } from "@/lib/controllers/routine.controller";

export default withAuth(async function handler(
    req: AuthenticatedRequest,
    res: NextApiResponse
) {
    try {
        switch (req.method) {
            case "GET":
                return await getRoutinesForDate(req, res);
            default:
                res.setHeader("Allow", ["GET"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error in API handler:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});