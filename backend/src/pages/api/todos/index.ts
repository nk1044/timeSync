import { connectDB } from "@/lib/config/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { createTodo, getAllTodo } from "@/lib/controllers/todo.controller";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    try {
        await connectDB();

        switch (req.method) {
            case "POST":
                return await createTodo(req, res);
            case "GET":
                return await getAllTodo(req, res);

            default:
                res.setHeader("Allow", ["POST"]);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Error in API handler:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
