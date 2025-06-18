import { connectDB } from "@/lib/config/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { updateDay, getDayById } from "@/lib/controllers/day.controller";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        await connectDB();
        
        switch (req.method) {
            case "GET":
                return await getDayById(req, res);
            case "PUT":
                return await updateDay(req, res);
            default:
                res.setHeader("Allow", ["GET"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error in API handler:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
