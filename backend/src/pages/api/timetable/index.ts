import { connectDB } from "@/lib/config/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { createTimeTable, getAllTimeTables, updateTimeTableDetails, deleteTimeTable } from "@/lib/controllers/timetable.controller";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    try {
        await connectDB();
        switch (req.method) {
            case "POST":
                return await createTimeTable(req, res);
            case "GET":
                return await getAllTimeTables(req, res);
            case "PUT":
                return await updateTimeTableDetails(req, res);
            case "DELETE":
                return await deleteTimeTable(req, res);
            default:
                res.setHeader("Allow", ["POST", "GET", "PUT", "DELETE"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error in API handler:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
