import { Week } from "@/lib/models/week.model";
import {NextApiResponse } from "next";
import { User , AuthenticatedRequest} from "@/lib/models/user.model";
import { logger } from "../config/logger";
import { isValidTimeString, isEndTimeAfterStartTime } from "@/lib/controllers/config";


const createWeek = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { metadata } = req.body;
    const user = req.user;
    logger.info(`🔍 Creating week for user: ${user?.email}`);
    if (!user) {
      console.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found" });
    }
    const currentUser = await User.findOne({ email: user.email });
    if (!currentUser) {
      logger.info(currentUser);
      logger.warn("❌ User not found in db for creating week");
      return res.status(404).json({ message: "User not found in db" });
    }

    if (!metadata || typeof metadata !== "string") {
      return res.status(400).json({ message: "metadata is required." });
    }

   const weekExists = await Week.findOne({ owner: currentUser._id });
    if (weekExists) {
      logger.warn(`❌ Week already exists for user ${user.email}`);
      return res.status(400).json({ message: "Week already exists for this user." });
    }

    const createdWeek = await Week.create({
      metadata: metadata.trim(),
      owner: currentUser._id,
    });
    if(!createdWeek) {
      logger.warn(`❌ Failed to create week for user ${user.email}`);
      return res.status(500).json({ message: "Failed to create week." });
    }
    logger.info(`✅ Week created successfully for user ${user.email}`);
    return res.status(201).json({message: "Week created successfully👍", week: createdWeek});
  } catch (error) {
    logger.error("Error creating week:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getDayByName = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const {name } = req.query;
    const user = req.user;
    if (!user) {
      logger.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found" });
    }
    const currentUser = await User.findOne({ email: user.email });
    if (!currentUser) {
      logger.warn("❌ User not found for update operation");
      return res.status(404).json({ message: "User not found." });
    }

    if (!name || typeof name !== "string") {
      logger.warn("❌ weekId and name are required for fetching day");
      return res.status(400).json({ message: "weekId and name are required." });
    }

    const week = await Week.findOne({ owner: currentUser._id }).populate({
      path: `${name}.events.event`,
      select: "-__v -createdAt -updatedAt",
    });

    if(currentUser[0]._id.toString() !== week?.owner.toString()) {
      logger.warn(`❌ Unauthorized access to week with name: ${name} by user ${user.email}`);
      return res.status(403).json({ message: "Unauthorized access to this week." });
    }

    if (!week || !week.days.length) {
      logger.warn(`❌ No day named '${name}' found in week with ID ${name}`);
      return res.status(404).json({ message: `No day named '${name}' found in this week.` });
    }

    return res.status(200).json({ day: week.days[0] });
  } catch (error) {
    logger.error("Error fetching day:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const addEventToDay = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { dayName, eventId, startTime, endTime, reminderTime } = req.body;
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

    if (!dayName || typeof dayName !== "string") {
      return res.status(400).json({ message: "dayName is required." });
    }

    if (!eventId || typeof eventId !== "string") {
      return res.status(400).json({ message: "eventId is required." });
    }

    if (!startTime || typeof startTime !== "string" || !isValidTimeString(startTime)) {
      return res.status(400).json({ message: "startTime must be in HH:MM format." });
    }

    if (!endTime || typeof endTime !== "string" || !isValidTimeString(endTime)) {
      return res.status(400).json({ message: "endTime must be in HH:MM format." });
    }

    if (!isEndTimeAfterStartTime(startTime, endTime)) {
      return res.status(400).json({
        message: `endTime (${endTime}) must be after startTime (${startTime})`,
      });
    }

    const normalizedDay = dayName.toUpperCase();
    const week = await Week.findOne({ owner: currentUser._id });

    if (!week) {
      logger.warn(`❌ Week not found for user ${user.email}`);
      return res.status(404).json({ message: "Week not found." });
    }

    const day = week[normalizedDay];
    if (!day || !Array.isArray(day.events)) {
      logger.warn(`❌ Day '${normalizedDay}' not found in week`);
      return res.status(404).json({ message: `Day '${normalizedDay}' not found in week.` });
    }

    day.events.push({
      event: eventId,
      startTime,
      endTime,
      reminderTime: reminderTime ?? null,
    });

    const updatedWeek = await Week.findByIdAndUpdate(
      week._id,
      { [normalizedDay]: day },
      { new: true, select: "-__v -createdAt -updatedAt" }
    );

    if (!updatedWeek) {
      logger.warn(`❌ Failed to update week while adding event to day ${normalizedDay}`);
      return res.status(500).json({ message: "Failed to update week." });
    }

    logger.info(`✅ Event added to day ${normalizedDay} successfully for user ${user.email}`);
    return res.status(200).json({
      message: `Event added to day ${normalizedDay} successfully`,
      week: updatedWeek,
    });
  } catch (error) {
    logger.error("Error adding event to day:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const removeEventFromDay = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { dayName, eventIndex } = req.query;
    const user = req.user;

    if (!user) {
      logger.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found" });
    }

    const currentUser = await User.findOne({ email: user.email });
    if (!currentUser) {
      logger.warn("❌ User not found for delete operation");
      return res.status(404).json({ message: "User not found." });
    }

    if (!dayName || typeof dayName !== "string") {
      logger.warn("❌ dayName is required");
      return res.status(400).json({ message: "dayName is required." });
    }

    if (eventIndex === undefined || isNaN(Number(eventIndex))) {
      logger.warn("❌ eventIndex is required and must be a number");
      return res.status(400).json({ message: "eventIndex is required and must be a number." });
    }

    const normalizedDay = dayName.toUpperCase();
    const week = await Week.findOne({ owner: currentUser._id });

    if (!week) {
      logger.warn(`❌ Week not found for user ${user.email}`);
      return res.status(404).json({ message: "Week not found." });
    }

    const day = week[normalizedDay];
    if (!day || !Array.isArray(day.events)) {
      logger.warn(`❌ Day '${normalizedDay}' not found in week`);
      return res.status(404).json({ message: `Day '${normalizedDay}' not found in week.` });
    }

    const index = +eventIndex;
    if (index < 0 || index >= day.events.length) {
      logger.warn(`❌ Invalid event index ${index} for day '${normalizedDay}'`);
      return res.status(400).json({ message: "Invalid event index." });
    }

    day.events.splice(index, 1); // remove the event at index

    const updatedWeek = await Week.findByIdAndUpdate(
      week._id,
      { [normalizedDay]: day },
      { new: true, select: "-__v -createdAt -updatedAt" }
    );

    if (!updatedWeek) {
      logger.warn(`❌ Failed to update week while deleting event from day ${normalizedDay}`);
      return res.status(500).json({ message: "Failed to update week." });
    }

    logger.info(`✅ Event removed from day ${normalizedDay} successfully for user ${user.email}`);
    return res.status(200).json({
      message: `Event removed from day ${normalizedDay} successfully`,
      week: updatedWeek,
    });

  } catch (error) {
    logger.error("Error removing event from day:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const getWeekData = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const user = req.user;
    if (!user) {
      logger.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found" });
    }

    const currentUser = await User.findOne({ email: user.email });
    if (!currentUser) {
      logger.warn("❌ User not found for update operation");
      return res.status(404).json({ message: "User not found." });
    }

    const week = await Week.findOne({ owner: currentUser._id })
      .populate([
        { path: "SUNDAY.events.event", select: "-__v -createdAt -updatedAt" },
        { path: "MONDAY.events.event", select: "-__v -createdAt -updatedAt" },
        { path: "TUESDAY.events.event", select: "-__v -createdAt -updatedAt" },
        { path: "WEDNESDAY.events.event", select: "-__v -createdAt -updatedAt" },
        { path: "THURSDAY.events.event", select: "-__v -createdAt -updatedAt" },
        { path: "FRIDAY.events.event", select: "-__v -createdAt -updatedAt" },
        { path: "SATURDAY.events.event", select: "-__v -createdAt -updatedAt" },
      ])
      .select("-__v -createdAt -updatedAt");

    if (!week) {
      logger.warn(`❌ Week not found`);
      return res.status(404).json({ message: "Week not found." });
    }

    if (currentUser._id.toString() !== week.owner.toString()) {
      logger.warn(`❌ Unauthorized access to week by user ${user.email}`);
      return res.status(403).json({ message: "Unauthorized access to this week." });
    }

    return res.status(200).json({
      message: "✅ Week data fetched successfully",
      week,
    });

  } catch (error) {
    console.error("❌ Error getting week data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateWeekMetadata = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { metadata } = req.body;
    const user = req.user;
    if (!user) {
      logger.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found" });
    }
    const currentUser = await User.findOne({ email: user.email });
    if (!currentUser) {
      logger.warn("❌ User not found for update operation");
      return res.status(404).json({ message: "User not found." });
    }
    const weekExists = await Week.findOne({ owner: currentUser._id });
    if (!weekExists) {
      logger.warn(`❌ Week not found for user ${user.email}`);  
      return res.status(404).json({ message: "Week not found." });
    };

    const week = await Week.findByIdAndUpdate(
      weekExists._id,
      { metadata: metadata.trim() },
      { new: true, select: "-__v -createdAt -updatedAt" }
    );

    if (!week) {
      logger.warn(`❌ Week not found for metadata update`);
      return res.status(404).json({ message: "Week not found." });
    }

    return res.status(200).json({ message: "Metadata updated", week });
  } catch (error) {
    console.error("Error updating metadata:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteWeek = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const user = req.user;
    if (!user) {
      logger.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found" });
    }
    const currentUser = await User.findOne({ email: user.email });
    if (!currentUser) {
      logger.warn("❌ User not found for delete operation");
      return res.status(404).json({ message: "User not found." });
    }
    const weekExists = await Week.findOne({ owner: currentUser._id });
    if (!weekExists) {
      logger.warn(`❌ Week not found for user ${user.email}`);
      return res.status(404).json({ message: "Week not found." });
    }
    const week = await Week.findByIdAndDelete(weekExists._id);
    if (!week) {
      logger.warn(`❌ Week not found for deletion`);
      return res.status(404).json({ message: "Week not found." });
    }
    return res.status(200).json({ message: "Week and associated days deleted." });
  } catch (error) {
    console.error("Error deleting week:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export {
  createWeek, //
  getDayByName, //
  getWeekData, //
  updateWeekMetadata, //
  deleteWeek, //
  addEventToDay, //
  removeEventFromDay
};
