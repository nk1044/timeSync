import { Day, normalizeDateOnly } from "@/lib/models/day.model";
import { NextApiResponse } from "next";
import {AuthenticatedRequest, User} from '@/lib/models/user.model';
import { logger } from "../config/logger";
import { Week } from "../models/week.model";
import { isValidTimeString, isEndTimeAfterStartTime } from "@/lib/controllers/config";

function getDayName(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  return days[date.getUTCDay()];
}


const createDay = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const {date} = req.body;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }
    const currentUser = await User.findOne({email: user.email});
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }
    const name = getDayName(date);
    if (!name || !date) {
      logger.error("Name or date is missing in request body", { name, date });
      return res.status(400).json({ message: "Name and date are required." });
    }
    const formattedDate = normalizeDateOnly(date);
    const existingDay = await Day.findOne({date: formattedDate, owner: currentUser._id});
    if (existingDay) {
      logger.warn("Day already exists for the given date", { date, userId: currentUser._id });
      return res.status(409).json({ message: "Day already exists for this date." });
    }
    const newDay = await Day.create({
      name: name.toUpperCase(),
      date: formattedDate,
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


const addEventToDay = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { date } = req.query;
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

    if (!date || typeof date !== "string" || !event || !startTime || !endTime) {
      logger.error("Missing required fields", { date, event, startTime, endTime });
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
    const formattedDate = normalizeDateOnly(date);
    const day = await Day.findOne({ date: formattedDate, owner: currentUser._id });
    if (!day) {
      logger.warn("Day not found for adding event", { daydate: date });
      return res.status(404).json({ message: "Day not found." });
    }
    if (day.owner.toString() !== currentUser._id.toString()) {
      logger.warn("Unauthorized access to add event to day", { daydate: date, userId: currentUser._id });
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
    const { date } = req.query;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }
    const currentUser = await User.findOne({email: user.email});
    if (!currentUser) {
      logger.error("Unauthorized: User not found.");
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }

    if (!date || typeof date !== "string") {
      logger.error("Invalid or missing Day ID", { date });
      return res.status(400).json({ message: "Invalid Day ID." });
    }
    const formattedDate = normalizeDateOnly(date);
    const day = await Day.findOne({date:formattedDate, owner: currentUser._id}).populate("events.event", "-__v -notes -description -message");
    if (!day) {
      logger.warn("Day not found for getting events", { dayId: date });
      return res.status(404).json({ message: "Day not found." });
    }
    if (day.owner.toString() !== currentUser._id.toString()) {
      logger.warn("Unauthorized access to get events of day", { daydate: date, userId: currentUser._id });
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
    const { date, eventIndex } = req.query;
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

    if (!date || typeof date !== "string" || eventIndex === undefined) {
      logger.error("Missing date or eventIndex", { daydate: date, eventIndex });
      return res.status(400).json({ message: "Missing date or eventIndex." });
    }
    const formattedDate = normalizeDateOnly(date);
    const day = await Day.findOne({ date: formattedDate, owner: currentUser._id });
    if (!day) {
      logger.warn("Day not found for deleting event", { daydate: date });
      return res.status(404).json({ message: "Day not found." });
    }
    if (day.owner.toString() !== currentUser._id.toString()) {
      logger.warn("Unauthorized access to delete event from day", { daydate: date, userId: currentUser._id });
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


const getDayByDate = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { date } = req.query;
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
    if (!date || typeof date !== "string") {
      logger.error("Invalid or missing date", { date });
      return res.status(400).json({ message: "Invalid or missing date." });
    }
    const formattedDate = normalizeDateOnly(date);
    const day = await Day.findOne({ date: formattedDate, owner: currentUser._id })
      .select("-__v")
      .populate({
        path: "events.event",
        model: "Event",
        select: "title description message tag",
      });
    if (!day) {
      const name = getDayName(date);
      const newDay = await Day.create({
        name: name.toUpperCase(),
        date: formattedDate,
        owner: currentUser._id,
      });
      if (!newDay) {
        logger.error("Failed to create day");
        return res.status(500).json({ message: "Failed to create day." });
      }
      const week = await Week.findOne({ owner: currentUser._id}).populate({
        path: `${name}.events.event`,
        select: "-__v -createdAt -updatedAt",
      });
      if(!week){
        logger.warn("Week not found for new day", { date, userId: currentUser._id });
        return res.status(200).json({ message: "Day fetched successfully", day: newDay });
      }
      newDay.events = week[name].events;
      await newDay.save();
      logger.info("New day created successfully", { date, userId: currentUser._id });
      return res.status(200).json({ message: "Day fetched successfully", day: newDay });
    }
    if (day.owner.toString() !== currentUser._id.toString()) {
      logger.warn("Unauthorized access to day by date", { date, userId: currentUser._id });
      return res.status(403).json({ message: "Forbidden: You do not have access to this day." });
    }
    logger.info("Day retrieved successfully by date");
    return res.status(200).json({ message: "Day retrieved successfully", day });
  } catch (error) {
    logger.error("Error fetching day by date:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export { 
    createDay,
    getDayByDate,
    addEventToDay,
    getEventsOfDay,
    deleteEventFromDay,
};
