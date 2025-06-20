import { Todo } from "../models/todo.model";
import type { NextApiRequest, NextApiResponse } from "next";
import { User, AuthenticatedRequest } from "../models/user.model";
import { logger } from "../config/logger";


const createTodo = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
        const { title, description, status, reminder, tag } = req.body;
        const user = req.user;
        logger.info(`🔍 Creating todo for user: ${user?.email}`);
        if (!user) {
            logger.warn("❌ Unauthorized Request, user not found");
            return res.status(401).json({ message: "Unauthorized Request, user not found" });
        }
        if ([title, status, tag].some((field) => !field)) {
            logger.warn("❌ Title, status, and tag are required.");
            return res.status(400).json({ message: "Title, status, and tag are required." });
        }
        logger.info(`✅Creating todo for user: ${user.email}`);
        const currentUser = await User.findOne({ email: user.email });
        if (!currentUser) {
            logger.warn("❌ User not found in DB");
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
        if (!newTodo) {
            logger.warn("❌ Failed to create todo");
            return res.status(500).json({ message: "Failed to create todo." });
        }
        logger.info("✅ Todo created successfully");
        return res.status(201).json({ message: "Todo created successfully", todo: newTodo });
    } catch (error) {
        logger.error(`Error creating todo: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getAllTodo = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
        logger.info(`🔍 Fetching all todos for user: ${req.user?.email}`);
        const user = req.user;
        if (!user) {
            logger.warn("❌ Unauthorized Request, user not found");
            return res.status(401).json({ message: "Unauthorized Request, user not found" });
        }
        const currentUser = await User.findOne({ email: user.email });
        if (!currentUser) {
            logger.warn("❌ User not found in DB");
            return res.status(404).json({ message: "User not found in DB" });
        }
        const allTodos = await Todo.find({owner: currentUser}).select('-__v -owner');
        if (!allTodos || allTodos.length === 0) {
            logger.warn("❌ No todos found for this user");
            return res.status(404).json({ message: "No todos found for this user." });
        }
        logger.info(`✅ Todos fetched successfully for user:", ${user.email}`);
        return res.status(201).json({ message: "All Todos fetched successfully", todo: allTodos });
    } catch (error) {
        logger.error(`Error getting all todo: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getTodoById = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
        const user = req.user;
        logger.info(`🔍 Fetching todo by ID for user: ${user?.email}`);
        if (!user) {
            logger.warn("❌ Unauthorized Request, user not found");
            return res.status(401).json({ message: "Unauthorized Request, user not found" });
        }
        const currentUser = await User.findOne({ email: user.email });
        if (!currentUser) {
            logger.warn("❌ User not found in DB");
            return res.status(404).json({ message: "User not found in DB" });
        }
        const { id } = req.query;
        
        if (!id) {
            logger.warn("❌ Todo ID is required.");
            return res.status(400).json({ message: "Todo ID is required." });
        }
        const todo = await Todo.findById(id).select('-__v');
        if (!todo) {
            logger.warn("❌ Todo not found.");
            return res.status(404).json({ message: "Todo not found." });
        }
        if( todo.owner.toString() !== currentUser._id.toString()) {
            logger.warn("❌ Forbidden: You do not have access to this todo.");
            return res.status(403).json({ message: "Forbidden: You do not have access to this todo." });
        }
        return res.status(200).json({ message: "A Todo fetched successfully", todo });
    } catch (error) {
        logger.error(`Error getting todo by ID: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const updateTodo = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
        const user = req.user;
        logger.info(`🔍 Updating todo for user: ${user?.email}`);
        if (!user) {
            logger.warn("❌ Unauthorized Request, user not found");
            return res.status(401).json({ message: "Unauthorized Request, user not found" });
        }
        const currentUser = await User.findOne({ email: user.email });
        if (!currentUser) {
            logger.warn("❌ User not found in DB");
            return res.status(404).json({ message: "User not found in DB" });
        }
        const { id } = req.query;
        const { title, description, status, reminder, tag } = req.body;
        if (!id) {
            logger.warn("❌ Todo ID is required.");
            return res.status(400).json({ message: "Todo ID is required." });
        }
        const todo = await Todo.findById(id);
        if (!todo) {
            logger.warn("❌ Todo not found.");
            return res.status(404).json({ message: "Todo not found." });
        }
        if (todo.owner.toString() !== currentUser._id.toString()) {
            logger.warn("❌ Forbidden: You do not have access to this todo.");
            return res.status(403).json({ message: "Forbidden: You do not have access to this todo." });
        }
        const updatedTodo = await Todo.findByIdAndUpdate(
            todo._id,
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
            logger.warn("❌ Todo not found for update.");
            return res.status(404).json({ message: "Todo not found." });
        }
        return res.status(200).json({ message: "Todo updated successfully", todo: updatedTodo });
    } catch (error) {
        logger.error(`Error updating todo: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const deleteTodo = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
        const user = req.user;
        logger.info(`🔍 Deleting todo for user: ${user?.email}`);        
        if (!user) {
            logger.warn("❌ Unauthorized Request, user not found");
            return res.status(401).json({ message: "Unauthorized Request, user not found" });
        }
        const currentUser = await User.findOne({ email: user.email });
        if (!currentUser) {
            logger.warn("❌ User not found in DB");
            return res.status(404).json({ message: "User not found in DB" });
        }
        const { id } = req.query;
        if (!id) {
            logger.warn("❌ Todo ID is required.");
            return res.status(400).json({ message: "Todo ID is required." });
        }
        const todo = await Todo.findById(id);
        if (!todo) {
            logger.warn("❌ Todo not found.");
            return res.status(404).json({ message: "Todo not found." });
        }
        if (todo.owner.toString() !== currentUser._id.toString()) {
            logger.warn("❌ Forbidden: You do not have access to this todo.");
            return res.status(403).json({ message: "Forbidden: You do not have access to this todo." });
        }
        const deletedTodo = await Todo.findByIdAndDelete(todo._id);
        if (!deletedTodo) {
            logger.warn("❌ Todo not found for deletion.");
            return res.status(404).json({ message: "Todo not found." });
        }
        return res.status(200).json({ message: "Todo deleted successfully", todo: deletedTodo });
    } catch (error) {
        logger.error(`Error deleting todo: ${error}`);
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