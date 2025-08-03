import type { NextApiResponse } from "next";
import { RoutineCard } from "@/lib/models/RoutineCard.model";
import { User, AuthenticatedRequest } from "@/lib/models/user.model"
import mongoose from "mongoose";
import { DateTime } from 'luxon';

// @route   POST /api/routines
export const createRoutine = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { Event, startTime, endTime, Day, Frequency, Exception } = req.body;

    if (!Event || !startTime || !endTime || !Day || !Frequency) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Store as ISO string or Date, or just the time as a string (if schema allows)
    const newRoutine = await RoutineCard.create({
      Event,
      startTime,
      endTime,
      Day,
      Frequency,
      Exception,
      owner: existingUser._id,
    });

    return res.status(201).json(newRoutine);
  } catch (error) {
    console.error("Create Routine Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// @route   GET /api/routines
export const getAllRoutines = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const routines = await RoutineCard.find({ owner: existingUser._id }).sort({ createdAt: -1 });

    return res.status(200).json(routines);
  } catch (error) {
    console.error("Get All Routines Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// @route   GET /api/routines/:id
export const getRoutineById = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const user = req.user;
    const { id } = req.query;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: "Invalid Routine ID" });
    }

    const routine = await RoutineCard.findOne({ _id: id, owner: existingUser._id });

    if (!routine) {
      return res.status(404).json({ error: "Routine not found" });
    }

    return res.status(200).json(routine);
  } catch (error) {
    console.error("Get Routine By ID Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// @route   PUT /api/routines/:id
export const updateRoutine = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const user = req.user;
    const { id } = req.query;
    const { Event, timings, Day, Frequency, Exception } = req.body;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: "Invalid Routine ID" });
    }

    const updatedRoutine = await RoutineCard.findOneAndUpdate(
      { _id: id, owner: existingUser._id },
      { Event, timings, Day, Frequency, Exception },
      { new: true }
    );

    if (!updatedRoutine) {
      return res.status(404).json({ error: "Routine not found or unauthorized" });
    }

    return res.status(200).json(updatedRoutine);
  } catch (error) {
    console.error("Update Routine Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// @route   DELETE /api/routines/:id
export const deleteRoutine = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
      
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: "Invalid Routine ID" });
    }

    const deleted = await RoutineCard.findOneAndDelete({ _id: id, owner: existingUser._id });

    if (!deleted) {
      return res.status(404).json({ error: "Routine not found or unauthorized" });
    }

    return res.status(200).json({ message: "Routine deleted successfully" });
  } catch (error) {
    console.error("Delete Routine Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getDayNameFromIST = (dateStr: string): string => {
  const date = new Date(dateStr);
  const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const dayName = istDate.toLocaleDateString("en-US", { weekday: "long" });
  return dayName;
};

// GET /api/routines/date?date=2025-07-27
export const getRoutinesForDate = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { date } = req.query;
    const user = req.user;
    if (!user || !user.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!date || typeof date !== "string") {
      return res.status(400).json({ error: "Missing or invalid date query params" });
    }

    const dayName = getDayNameFromIST(date);

    const routines = await RoutineCard.find({
      owner: existingUser._id,
      $or: [
        { Frequency: "daily" },
        { Frequency: "weekly", Day: dayName }
      ]
    }).populate('Event');

    const routinesWithEventMessage = routines.map(r => ({
      _id: r._id,
      Event: r.Event.title || r.Event._id || "No event title",
      startTime: r.startTime,
      endTime: r.endTime,
      Day: r.Day,
      Frequency: r.Frequency,
      Exception: r.Exception,
      owner: r.owner,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      eventMessage: r.Event?.message || r.Event?.title || "No event message",
    }));

    return res.status(200).json(routinesWithEventMessage);
  } catch (error) {
    console.error("Error fetching routines for date:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
