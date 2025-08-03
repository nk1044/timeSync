import { Event } from "../models/event.model";
import { User, AuthenticatedRequest } from "../models/user.model";
import type {NextApiResponse } from "next";
import mongoose from "mongoose";

// Create Event
export const createEvent = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { title, description, message, bucket } = req.body;
    const user = req.user;
    if( !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const newEvent = await Event.create({
      title,
      description,
      message,
      bucket,
      owner: existingUser._id,
    });

    return res.status(201).json(newEvent);
  } catch (error) {
    console.error("Create Event Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get all events for a user
export const getAllEvents = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const user = req.user;
    if( !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const events = await Event.find({ owner: existingUser._id }).sort({ createdAt: -1 });

    return res.status(200).json({message:"events fetched successfully", events: events});
  } catch (error) {
    console.error("Get Events Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get event by ID (if it belongs to the user)
export const getEventById = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const user = req.user;
    const { id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    if( !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const event = await Event.findOne({ _id: id, owner: existingUser._id });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(200).json({message:"event fetched successfully", event: event});
  } catch (error) {
    console.error("Get Event By ID Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update event by ID (only if user owns it)
export const updateEvent = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const user = req.user;
    const { id } = req.query;
    const { title, description, message, bucket } = req.body;

    if( !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const updatedEvent = await Event.findOneAndUpdate(
      { _id: id, owner: existingUser._id },
      { title, description, message, bucket },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ error: "Event not found or unauthorized" });
    }

    return res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Update Event Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete event by ID (only if user owns it)
export const deleteEvent = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const user = req.user;
    const { id } = req.query;

    if( !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const deleted = await Event.findOneAndDelete({ _id: id, owner: existingUser._id });

    if (!deleted) {
      return res.status(404).json({ error: "Event not found or unauthorized" });
    }

    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete Event Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
