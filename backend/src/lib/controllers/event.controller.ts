import { Event } from "../models/event.model";
import type { NextApiRequest, NextApiResponse } from "next";
import { User, AuthenticatedRequest } from "../models/user.model";
import { logger } from "../config/logger";


const createEvent = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
        const { title, description, tag, message } = req.body;
        const user = req.user;
        if (!user) {
            logger.warn("❌ Unauthorized Request, user not found");
            return res.status(401).json({ message: "Unauthorized Request, user not found" });
        }
        logger.info(`🔍 Creating event for user: ${user?.email}`);
        if ([title, tag, message].some(field => !field)) {
            logger.warn("❌ Title, message, and tag are required.");
            return res.status(400).json({ message: "Title, message, and tag are required." });
        }
        const currentUser = await User.findOne({ email: user.email });
        if (!currentUser) {
            logger.warn("❌ User not found in DB");
            return res.status(404).json({ message: "User not found." });
        }
        const newEvent = await Event.create({
            title:title,
            description: description || "",
            tag: tag,
            owner: currentUser._id,
            message: message || "",
        });
        if (!newEvent) {
            logger.warn("❌ Failed to create event");
            return res.status(500).json({ message: "Failed to create event." });
        }
        const eventData = await Event.findById(newEvent._id).select("-__v -owner -notes");
        return res.status(201).json({ message: "Event created successfully", event: eventData });
    } catch (error) {
        logger.error(`Error creating event: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
const getAllEvents = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
        const user = req.user;
        if (!user) {
            logger.warn("❌ Unauthorized Request, user not found");
            return res.status(401).json({ message: "Unauthorized Request, user not found" });
        }
        const currentUser = await User.findOne({ email: user.email });
        if (!currentUser) {
            logger.warn("❌ User not found in DB");
            return res.status(404).json({ message: "User not found." });
        }
        logger.info(`🔍 Fetching all events for user: ${currentUser?.email}`);
        const allEvents = await Event.find({owner: currentUser}).select("-__v -description -owner -notes");
        if (!allEvents) {
            logger.info("No events found for the user.");
            return res.status(404).json({ message: "No events found." });
        }
        return res.status(200).json({ message: "All Events fetched successfully", events: allEvents });
    } catch (error) {
        logger.error(`Error getting all events: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
const getEventById = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
        logger.info("🔍 Fetching event by ID");
        const user = req.user;
        if (!user) {
            logger.warn("❌ Unauthorized Request, user not found");
            return res.status(401).json({ message: "Unauthorized Request, user not found" });
        }
        const { id } = req.query;
        if (!id) {
            logger.warn("❌ Event ID is required.");
            return res.status(400).json({ message: "Event ID is required." });
        }
        const currentUser = await User.findOne({ email: user.email });
        if (!currentUser) {
            logger.warn("❌ User not found in DB");
            return res.status(404).json({ message: "User not found." });
        }
        const event = await Event.findById(id).select("-__v -notes");
        if (!event) {
            logger.warn("❌ Event not found.");
            return res.status(404).json({ message: "Event not found." });
        }
        if(event.owner.toString() !== currentUser._id.toString()) {
            logger.warn("❌ Unauthorized access to event.");
            return res.status(403).json({ message: "Unauthorized access to this event." });
        }
        const eventData = {
            _id: event._id,
            title: event.title,
            description: event.description,
            tag: event.tag,
            message: event.message,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
        };
        logger.info(`✅ Event fetched successfully for user: ${user.email}`);
        return res.status(200).json({ message: "Event fetched successfully", event: eventData });
    } catch (error) {
        logger.error(`Error getting event by ID: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
const updateEvent = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
        const user = req.user;
        if (!user) {
            logger.warn("❌ Unauthorized Request, user not found");
            return res.status(401).json({ message: "Unauthorized Request, user not found" });
        }
        const currentUser = await User.findOne({ email: user.email });
        if (!currentUser) {
            logger.warn("❌ User not found in DB");
            return res.status(404).json({ message: "User not found." });
        }
        logger.info(`🔍 Updating event for user: ${currentUser?.email}`);
        const { id } = req.query;
        const { title, description, tag, message } = req.body;

        if (!id) {
            logger.warn("❌ Event ID is required.");
            return res.status(400).json({ message: "Event ID is required." });
        }
        const event = await Event.findById(id);
        if (!event) {
            logger.warn("❌ Event not found.");
            return res.status(404).json({ message: "Event not found." });
        }
        if (event.owner.toString() !== currentUser._id.toString()) {
            logger.warn("❌ Unauthorized access to event.");
            return res.status(403).json({ message: "Unauthorized access to this event." });
        }
        const updatedEvent = await Event.findByIdAndUpdate(event._id, {
            title:title,
            description: description,
            tag: tag,
            message: message,
        }, { new: true }).select("-__v -notes");

        if (!updatedEvent) {
            logger.warn("❌ Event not found.");
            return res.status(404).json({ message: "Event not found." });
        }
        logger.info(`✅ Event updated successfully for user: ${user.email}`);
        return res.status(200).json({ message: "Event updated successfully", event: updatedEvent });
    } catch (error) {
        logger.error(`Error updating event: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
const deleteEvent = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
        const user = req.user;
        if (!user) {
            logger.warn("❌ Unauthorized Request, user not found");
            return res.status(401).json({ message: "Unauthorized Request, user not found" });
        }
        const currentUser = await User.findOne({ email: user.email });
        if (!currentUser) {
            logger.warn("❌ User not found in DB");
            return res.status(404).json({ message: "User not found." });
        }
        logger.info(`🔍 Deleting event for user: ${currentUser?.email}`);
        const { id } = req.query;
        if (!id) {
            logger.warn("❌ Event ID is required.");
            return res.status(400).json({ message: "Event ID is required." });
        }
        const event = await Event.findById(id);
        if (!event) {
            logger.warn("❌ Event not found.");
            return res.status(404).json({ message: "Event not found." });
        }
        if (event.owner.toString() !== currentUser._id.toString()) {
            logger.warn("❌ Unauthorized access to event.");
            return res.status(403).json({ message: "Unauthorized access to this event." });
        }
        const deletedEvent = await Event.findByIdAndDelete(event._id);
        if (!deletedEvent) {
            logger.warn("❌ Event not found for deletion.");
            return res.status(404).json({ message: "Event not found." });
        }
        logger.info(`✅ Event deleted successfully for user: ${user.email}`);
        return res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        logger.error(`Error deleting event: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const getTodosOfEvent = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
        const user = req.user;
        if (!user) {
            logger.warn("❌ Unauthorized Request, user not found");
            return res.status(401).json({ message: "Unauthorized Request, user not found" });
        }
        const currentUser = await User.findOne({ email: user.email });
        if (!currentUser) {
            logger.warn("❌ User not found in DB");
            return res.status(404).json({ message: "User not found." });
        }
        logger.info(`🔍 Fetching todos for event for user: ${currentUser?.email}`);
        const { id } = req.query;
        if (!id) {
            logger.warn("❌ Event ID is required.");
            return res.status(400).json({ message: "Event ID is required." });
        }
        const event = await Event.findById(id).populate("notes").select("-__v");
        if (!event) {
            logger.warn("❌ Event not found.");
            return res.status(404).json({ message: "Event not found." });
        }
        if (event.owner.toString() !== currentUser._id.toString()) {
            logger.warn("❌ Unauthorized access to event.");
            return res.status(403).json({ message: "Unauthorized access to this event." });
        }
        if (!event.notes) {
            logger.info("No todos found for the event.");
            return res.status(404).json({ message: "No todos found for the event." });
        }
        return res.status(200).json({ message: "Event Todos fetched successfully", todos: event.notes });
    } catch (error) {
        logger.error(`Error getting todos of event: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getTodosOfEvent
};