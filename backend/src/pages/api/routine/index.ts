import { connectDB } from "@/lib/config/db";
import type { NextApiResponse } from "next";
import { withAuth } from "@/lib/middleware/authMiddleware";
import { AuthenticatedRequest } from "@/lib/models/user.model";
import { createRoutine, deleteRoutine, getAllRoutines } from "@/lib/controllers/routine.controller";

export default withAuth(async function handler(
    req: AuthenticatedRequest,
    res: NextApiResponse,
) {
    try {
        await connectDB();

        switch (req.method) {
            case "GET":
                return await getAllRoutines(req, res);
            case "POST":
                return await createRoutine(req, res);
            default:
                res.setHeader("Allow", ["GET", "POST"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error in API handler:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
