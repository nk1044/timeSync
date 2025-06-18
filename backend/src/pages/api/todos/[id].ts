import { connectDB } from "@/lib/config/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { getTodoById, updateTodo, deleteTodo } from "@/lib/controllers/todo.controller";
import { withAuth } from "@/lib/middleware/authMiddleware";

export default withAuth(
    async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        await connectDB();
        
        switch (req.method) {
            case "GET":
                return await getTodoById(req, res);
            case "PUT":
                return await updateTodo(req, res);
            case "DELETE":
                return await deleteTodo(req, res);
            default:
                res.setHeader("Allow", ["GET"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error in API handler:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
