import { NextApiRequest, NextApiResponse } from "next";
import { addEventToDay, getEventsOfDay, updateEventInDay, deleteEventFromDay } from "@/lib/controllers/day.controller";
import { withAuth } from "@/lib/middleware/authMiddleware";
import { AuthenticatedRequest } from "@/lib/models/user.model";

export default withAuth(async function handler(
    req: AuthenticatedRequest,
    res: NextApiResponse
) {
    try {
        switch (req.method) {
            case "POST":
                return await addEventToDay(req, res);
            case "GET":
                return await getEventsOfDay(req, res);
            case "PUT":
                return await updateEventInDay(req, res);
            case "DELETE":
                return await deleteEventFromDay(req, res);
            default:
                res.setHeader("Allow", ["POST", "GET"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error in API handler:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});