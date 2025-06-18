import { Event } from "../models/event.model";
import type { NextApiRequest, NextApiResponse } from "next";


const createEvent = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { title, description, tag, message } = req.body;
        if ([title, tag, message].some(field => !field)) {
            return res.status(400).json({ message: "Title, message, and tag are required." });
        }
        const newEvent = await Event.create({
            title:title,
            description: description || "",
            tag: tag,
            message: message || "",
        });
        if (!newEvent) {
            return res.status(500).json({ message: "Failed to create event." });
        }
        const eventData = await Event.findById(newEvent._id).select("-__v -createdAt -updatedAt -notes");
        return res.status(201).json({ message: "Event created successfully", event: eventData });
    } catch (error) {
        console.error("Error creating event:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
const getAllEvents = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const allEvents = await Event.find().select("-__v -createdAt -description -message -updatedAt -notes");
        return res.status(200).json({ message: "All Events fetched successfully", events: allEvents });
    } catch (error) {
        console.error("Error getting all events:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
const getEventById = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ message: "Event ID is required." });
        }
        const event = await Event.findById(id).select("-__v -notes");
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }
        return res.status(200).json({ message: "Event fetched successfully", event: event });
    } catch (error) {
        console.error("Error getting event by ID:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
const updateEvent = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { id } = req.query;
        const { title, description, tag, message } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Event ID is required." });
        }

        const updatedEvent = await Event.findByIdAndUpdate(id, {
            title:title,
            description: description,
            tag: tag,
            message: message,
        }, { new: true }).select("-__v -notes");

        if (!updatedEvent) {
            return res.status(404).json({ message: "Event not found." });
        }

        return res.status(200).json({ message: "Event updated successfully", event: updatedEvent });
    } catch (error) {
        console.error("Error updating event:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
const deleteEvent = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ message: "Event ID is required." });
        }
        const deletedEvent = await Event.findByIdAndDelete(id);
        if (!deletedEvent) {
            return res.status(404).json({ message: "Event not found." });
        }
        return res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
export {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent
};