import { connectDB } from "@/lib/config/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { rotateOngoingWeek} from "@/lib/controllers/timetable.controller";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    try {
        await connectDB();
        switch (req.method) {
            case "GET":
                return await rotateOngoingWeek(req, res);
            default:
                res.setHeader("Allow", ["GET"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error in API handler:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
