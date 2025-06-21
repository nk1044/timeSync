import { Day } from "@/lib/models/day.model";
import { NextApiResponse } from "next";
import {AuthenticatedRequest, User} from '@/lib/models/user.model';
import { logger } from "../config/logger";

const createDay = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { name, date } = req.body;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }
    const currentUser = await User.findOne({email: user.email});
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }

    if (!name || !date) {
      logger.error("Name or date is missing in request body", { name, date });
      return res.status(400).json({ message: "Name and date are required." });
    }
    const newDay = await Day.create({
      name: name.toUpperCase(),
      date: date,
      owner: currentUser._id,
    });
    if (!newDay) {
      logger.error("Failed to create day");
      return res.status(500).json({ message: "Failed to create day." });
    }
    const dayData = await Day.findById(newDay._id).select("-__v -createdAt -updatedAt -events");
    if (!dayData) {
      logger.error("Day not found after creation", { dayId: newDay._id });
      return res.status(404).json({ message: "Day not found." });
    }
    logger.info("Day created successfully");
    return res.status(201).json({ message: "Day created successfully", day: dayData });
  } catch (error) {
    logger.error("Error creating day:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllDays = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }
    const currentUser = await User.findOne({email: user.email});
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }
    const days = await Day.find({owner:currentUser._id}).select("-__v -createdAt -updatedAt -events");
    if (!days || days.length === 0) {
      logger.warn("No days found for user");
      return res.status(404).json({ message: "No days found." });
    }
    return res.status(200).json({ message: "Days retrieved successfully", days });
  } catch (error) {
    logger.error("Error retrieving days:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getDayById = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }
    const currentUser = await User.findOne({email: user.email});
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }
    if (!id || typeof id !== "string") {
      logger.error("Invalid or missing Day ID", { id });
      return res.status(400).json({ message: "Invalid or missing Day ID." });
    }

    const day = await Day.findById(id).select("-__v -events");
    if (!day) {
      logger.warn("Day not found", { dayId: id });
      return res.status(404).json({ message: "Day not found." });
    }
    if (day.owner.toString() !== currentUser._id.toString()) {
      logger.warn("Unauthorized access to day", { dayId: id, userId: currentUser._id });
      return res.status(403).json({ message: "Forbidden: You do not have access to this day." });
    }
    logger.info("Day retrieved successfully");
    return res.status(200).json({ message: "Day retrieved successfully", day });
  } catch (error) {
    logger.error("Error fetching day:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateDay = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    const { name, date } = req.body;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }
    const currentUser = await User.findOne({email: user.email});
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }

    if (!id || typeof id !== "string") {
      logger.error("Invalid or missing Day ID", { id });
      return res.status(400).json({ message: "Invalid or missing Day ID." });
    }
    const dayExists = await Day.findById(id);
    if (!dayExists) {
      logger.warn("Day not found for update", { dayId: id });
      return res.status(404).json({ message: "Day not found." });
    }
    if (dayExists.owner.toString() !== currentUser._id.toString()) {
      logger.warn("Unauthorized access to update day", { dayId: id, userId: currentUser._id });
      return res.status(403).json({ message: "Forbidden: You do not have access to this day." });
    }
    const updatedDay = await Day.findByIdAndUpdate(
      id,
      { name, date },
      { new: true, runValidators: true }
    ).select("-__v -events");

    if (!updatedDay) {
      logger.error("Failed to update day", { dayId: id });
      return res.status(404).json({ message: "Day not found." });
    }

    return res.status(200).json({ message: "Day updated successfully", day: updatedDay });
  } catch (error) {
    logger.error("Error updating day:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const isValidTimeString = (value: string): boolean =>
  /^\d{2}:\d{2}$/.test(value);

const isEndTimeAfterStartTime = (start: string, end: string): boolean => {
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  return endH > startH || (endH === startH && endM > startM);
};

const addEventToDay = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    const { event, startTime, endTime, reminderTime } = req.body;
    const user = req.user;
    if(!user){
      logger.error("Unauthorized: User not found.");
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }
    const currentUser = await User.findOne({email: user.email});
    if (!currentUser) {
      logger.error("Unauthorized: User not found.");
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }

    if (!id || typeof id !== "string" || !event || !startTime || !endTime) {
      logger.error("Missing required fields", { id, event, startTime, endTime });
      return res.status(400).json({ message: "Missing required fields." });
    }
    if (!isValidTimeString(startTime)) {
      logger.error("Invalid startTime format", { startTime });
      return res
        .status(400)
        .json({ message: "startTime must be in HH:MM format" });
    }
    if (!isValidTimeString(endTime)) {
      logger.error("Invalid endTime format", { endTime });
      return res
        .status(400)
        .json({ message: "endTime must be in HH:MM format" });
    }
    if (!isEndTimeAfterStartTime(startTime, endTime)) {
      logger.error("endTime is not after startTime", { startTime, endTime });
      return res.status(400).json({
        message: `endTime (${endTime}) must be after startTime (${startTime})`,
      });
    }
    const day = await Day.findById(id);
    if (!day) {
      logger.warn("Day not found for adding event", { dayId: id });
      return res.status(404).json({ message: "Day not found." });
    }
    if (day.owner.toString() !== currentUser._id.toString()) {
      logger.warn("Unauthorized access to add event to day", { dayId: id, userId: currentUser._id });
      return res.status(403).json({ message: "Forbidden: You do not have access to this day." });
    }
    day.events.push({ event, startTime, endTime, reminderTime });
    await day.save();
    return res
      .status(200)
      .json({ message: "Event added successfully"});
  } catch (error) {
    logger.error("Error adding event:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getEventsOfDay = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }
    const currentUser = await User.findOne({email: user.email});
    if (!currentUser) {
      logger.error("Unauthorized: User not found.");
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }

    if (!id || typeof id !== "string") {
      logger.error("Invalid or missing Day ID", { id });
      return res.status(400).json({ message: "Invalid Day ID." });
    }

    const day = await Day.findById(id).populate("events.event", "-__v -notes -description -message");
    if (!day) {
      logger.warn("Day not found for getting events", { dayId: id });
      return res.status(404).json({ message: "Day not found." });
    }
    if (day.owner.toString() !== currentUser._id.toString()) {
      logger.warn("Unauthorized access to get events of day", { dayId: id, userId: currentUser._id });
      return res.status(403).json({ message: "Forbidden: You do not have access to this day." });
    }

    return res.status(200).json({ message: "Events fetched successfully", events: day.events });
  } catch (error) {
    logger.error("Error getting events:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteEventFromDay = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { dayId, eventIndex } = req.query;
    const user = req.user;
    if (!user) {
      logger.error("Unauthorized: User not found.");
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }
    const currentUser = await User.findOne({email: user.email});
    if (!currentUser) {
      logger.error("Unauthorized: User not found.");
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }

    if (!dayId || typeof dayId !== "string" || eventIndex === undefined) {
      logger.error("Missing dayId or eventIndex", { dayId, eventIndex });
      return res.status(400).json({ message: "Missing dayId or eventIndex." });
    }

    const day = await Day.findById(dayId);
    if (!day) {
      logger.warn("Day not found for deleting event", { dayId });
      return res.status(404).json({ message: "Day not found." });
    }
    if (day.owner.toString() !== currentUser._id.toString()) {
      logger.warn("Unauthorized access to delete event from day", { dayId, userId: currentUser._id });
      return res.status(403).json({ message: "Forbidden: You do not have access to this day." });
    }

    if (day.events.length <= +eventIndex) {
      return res.status(400).json({ message: "Invalid event index." });
    }

    day.events.splice(+eventIndex, 1);
    await day.save();

    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    logger.error("Error deleting event:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateEventInDay = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { dayId, eventIndex } = req.query;
    const { event, startTime, endTime, reminderTime } = req.body;
    const user = req.user;
    if (!user) {
      logger.error("Unauthorized: User not found.");
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }
    const currentUser = await User.findOne({email: user.email});
    if (!currentUser) {
      logger.error("Unauthorized: User not found.");
      return res.status(401).json({ message: "Unauthorized: User not found. in DB" });
    }
    if (!dayId || typeof dayId !== "string" || eventIndex === undefined) {
      logger.error("Missing dayId or eventIndex", { dayId, eventIndex });
      return res.status(400).json({ message: "Missing dayId or eventIndex." });
    }
    if (startTime && !isValidTimeString(startTime)) {
      return res
        .status(400)
        .json({ message: "startTime must be in HH:MM format" });
    }
    if (endTime && !isValidTimeString(endTime)) {
      return res
        .status(400)
        .json({ message: "endTime must be in HH:MM format" });
    }
    if (startTime && endTime && !isEndTimeAfterStartTime(startTime, endTime)) {
      return res.status(400).json({
        message: `endTime (${endTime}) must be after startTime (${startTime})`,
      });
    }

    const day = await Day.findById(dayId);
    if (!day) {
      logger.warn("Day not found for updating event", { dayId });
      return res.status(404).json({ message: "Day not found." });
    }
    if (day.owner.toString() !== currentUser._id.toString()) {
      logger.warn("Unauthorized access to update event in day", { dayId, userId: currentUser._id });
      return res.status(403).json({ message: "Forbidden: You do not have access to this day." });
    }
    const index = +eventIndex;
    if (index < 0 || index >= day.events.length) {
      return res.status(400).json({ message: "Invalid event index." });
    }

    const targetEvent = day.events[index];
    if (event) targetEvent.event = event;
    if (startTime) targetEvent.startTime = startTime;
    if (endTime) targetEvent.endTime = endTime;
    if (reminderTime !== undefined) targetEvent.reminderTime = reminderTime;

    await day.save();

    return res.status(200).json({ message: "Event updated successfully" });
  } catch (error) {
    logger.error("Error updating event:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



export { 
    createDay,
    getAllDays,
    getDayById,
    updateDay,
    addEventToDay,
    getEventsOfDay,
    deleteEventFromDay,
    updateEventInDay
};
