import { connectDB } from "@/lib/config/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { createDay, getAllDays } from "@/lib/controllers/day.controller";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    try {
        await connectDB();

        switch (req.method) {
            case "POST":
                return await createDay(req, res);
            case "GET":
                return await getAllDays(req, res);

            default:
                res.setHeader("Allow", ["POST"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error in API handler:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
