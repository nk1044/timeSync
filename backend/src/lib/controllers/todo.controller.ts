import { Todo } from "../models/todo.model";
import type { NextApiRequest, NextApiResponse } from "next";
import { User, AuthenticatedRequest } from "../models/user.model";


const createTodo = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
        const { title, description, status, reminder, tag } = req.body;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized Request, user not found" });
        }
        if ([title, status, tag].some((field) => !field)) {
            return res.status(400).json({ message: "Title, status, and tag are required." });
        }
        console.log("✅Creating todo for user:", user);
        const currentUser = await User.findOne({ email: user.email });
        if (!currentUser) {
            return res.status(404).json({ message: "User not found." });
        }

        const newTodo = await Todo.create({
            title: title,
            description: description || "",
            owner: currentUser._id,
            status: status || "PERSONAL",
            reminder: reminder ? new Date(reminder) : null,
            tag: tag || "NOT_IMPORTANT",
        });

        return res.status(201).json({ message: "Todo created successfully", todo: newTodo });
    } catch (error) {
        console.log("Error creating todo:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getAllTodo = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const allTodos = await Todo.find();
        return res.status(201).json({ message: "All Todos fetched successfully", todo: allTodos });
    } catch (error) {
        console.log("Error getting all todo:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getTodoById = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        console.log("Fetching todo with ID");
        const { id } = req.query;
        
        if (!id) {
            return res.status(400).json({ message: "Todo ID is required." });
        }
        const todo = await Todo.findById(id);
        if (!todo) {
            return res.status(404).json({ message: "Todo not found." });
        }
        return res.status(200).json({ message: "A Todo fetched successfully", todo });
    } catch (error) {
        console.log("Error getting todo by ID:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const updateTodo = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { id } = req.query;
        const { title, description, status, reminder, tag } = req.body;
        if (!id) {
            return res.status(400).json({ message: "Todo ID is required." });
        }
        const updatedTodo = await Todo.findByIdAndUpdate(
            id,
            {
                title,
                description,
                status,
                reminder: reminder ? new Date(reminder) : null,
                tag
            },
            { new: true }
        );
        if (!updatedTodo) {
            return res.status(404).json({ message: "Todo not found." });
        }
        return res.status(200).json({ message: "Todo updated successfully", todo: updatedTodo });
    } catch (error) {
        console.log("Error updating todo:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const deleteTodo = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ message: "Todo ID is required." });
        }
        const deletedTodo = await Todo.findByIdAndDelete(id);
        if (!deletedTodo) {
            return res.status(404).json({ message: "Todo not found." });
        }
        return res.status(200).json({ message: "Todo deleted successfully", todo: deletedTodo });
    } catch (error) {
        console.log("Error deleting todo:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export {
    createTodo,
    getAllTodo,
    getTodoById,
    updateTodo,
    deleteTodo
}