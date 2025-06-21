import { AuthenticatedRequest } from "@/lib/models/user.model";
import { NextApiResponse } from "next";
import { getATimeTableByID } from "@/lib/controllers/timetable.controller";
import { connectDB } from "@/lib/config/db";
import { withAuth } from "@/lib/middleware/authMiddleware";

export default withAuth(
    async function handler(
    req: AuthenticatedRequest,
    res: NextApiResponse
) {
    try {
        await connectDB();

        switch (req.method) {
            case "GET":
                return await getATimeTableByID(req, res);
            default:
                res.setHeader("Allow", ["GET"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error in API handler:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
)