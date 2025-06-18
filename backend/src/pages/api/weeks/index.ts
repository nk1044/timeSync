import { connectDB } from "@/lib/config/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { createWeek, getWeekData, updateWeekMetadata, deleteWeek } from "@/lib/controllers/week.controller";
import { withAuth } from "@/lib/middleware/authMiddleware";

export default withAuth(async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    try {
        await connectDB();
        switch (req.method) {
            case "POST":
                return await createWeek(req, res);
            case "GET":
                return await getWeekData(req, res);
            case "PUT":
                return await updateWeekMetadata(req, res);
            case "DELETE":
                return await deleteWeek(req, res);
            default:
                res.setHeader("Allow", ["POST", "GET", "PUT", "DELETE"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error in API handler:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
