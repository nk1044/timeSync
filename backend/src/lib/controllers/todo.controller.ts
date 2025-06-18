import { Todo } from "../models/todo.model";
import type { NextApiRequest, NextApiResponse } from "next";

const createTodo = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { title, description, status, reminder, tag } = req.body;
        if([title, status, tag].some(field => !field)) {
            return res.status(400).json({ message: "Title, status, and tag are required." });
        }
        const newTodo = await Todo.create({
            title: title,
            description: description || "",
            status: status || "PERSONAL",
            reminder: reminder ? new Date(reminder) : null,
            tag: tag || "NOT_IMPORTANT"
        });
        res.status(201).json({message: "Todo created successfully", todo: newTodo});
    } catch (error) {
        console.log("Error creating todo:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


export {
    createTodo,
}