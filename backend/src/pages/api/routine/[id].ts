import { connectDB } from "@/lib/config/db";
import { deleteRoutine, getRoutineById, updateRoutine } from "@/lib/controllers/routine.controller";
import { withAuth } from "@/lib/middleware/authMiddleware";
import { AuthenticatedRequest } from "@/lib/models/user.model";
import type { NextApiResponse } from "next";

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  await connectDB();
  switch (req.method) {
    case "GET":
      return await getRoutineById(req, res);
    case "PUT":
      return await updateRoutine(req, res);
    case "DELETE":
      return await deleteRoutine(req, res);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
};

export default withAuth(handler);
