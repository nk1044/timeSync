import { Day, IDay } from "@/lib/models/day.model";
import { Week } from "@/lib/models/week.model";
import { NextApiRequest, NextApiResponse } from "next";
import { User, IUser , AuthenticatedRequest} from "@/lib/models/user.model";
import { logger } from "../config/logger";

const getCurrentWeekDates = (): { name: string; date: Date }[] => {
  const dayNames = [
    "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
  ];

  const today = new Date();
  const currentDayIndex = today.getDay();

  const sunday = new Date(today);
  sunday.setDate(today.getDate() - currentDayIndex);
  sunday.setHours(0, 0, 0, 0);

  return dayNames.map((name, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);
    return { name, date };
  });
};

const createWeekWithDays = async (metadata: string, owner: IUser) => {
  try {
    const weekDays = getCurrentWeekDates();
    const createdDays = await Promise.all(
      weekDays.map(({ name, date }) => Day.create({ 
        name: name.toUpperCase(), 
        date: date,
        owner: owner._id, // Associate the day with the owner 
      }))
    );
    const newWeek = await Week.create({
      metadata: metadata.trim(),
      days: createdDays.map(day => day._id),
      owner: owner._id,
    });
    if (!newWeek) {
      console.log("Failed to create week");
      return null;
    }
    return { newWeek, createdDays };
  } catch (error) {
    console.error("Error creating week and days:", error);
    return null;
  }
};

const createWeek = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { metadata } = req.body;
    const user = req.user;
    if (!user) {
      console.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found" });
    }
    const currentUser = await User.find({ email: user.email });
    if (!currentUser || !currentUser.length) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!metadata || typeof metadata !== "string") {
      return res.status(400).json({ message: "metadata is required." });
    }

    const newWeekData = await createWeekWithDays(metadata, currentUser[0]);
    if (!newWeekData) {
      return res.status(500).json({ message: "Failed to create week and days." });
    }
    const { newWeek, createdDays } = newWeekData;

    const cleanDays = createdDays.map(day => ({
      _id: day._id,
      name: day.name,
      date: day.date,
    }));

    const cleanWeek = {
      _id: newWeek._id,
      metadata: newWeek.metadata,
      days: cleanDays.map(day => day._id),
    };
    return res.status(201).json({
      message: "Week created successfully",
      week: cleanWeek,
    });

  } catch (error) {
    logger.error("Error creating week:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getDayByName = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { weekId, name } = req.query;
    const user = req.user;
    if (!user) {
      logger.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found" });
    }
    const currentUser = await User.find({ email: user.email });
    if (!currentUser || !currentUser.length) {
      logger.warn("❌ User not found for update operation");
      return res.status(404).json({ message: "User not found." });
    }

    if (!weekId || typeof weekId !== "string" || !name || typeof name !== "string") {
      logger.warn("❌ weekId and name are required for fetching day");
      return res.status(400).json({ message: "weekId and name are required." });
    }

    const week = await Week.findById(weekId).populate({
      path: "days",
      match: { name: name.toUpperCase() },
      select: "-__v -createdAt -updatedAt",
    });
    if(currentUser[0]._id.toString() !== week?.owner.toString()) {
      logger.warn(`❌ Unauthorized access to week with ID ${weekId} by user ${user.email}`);
      return res.status(403).json({ message: "Unauthorized access to this week." });
    }

    if (!week || !week.days.length) {
      logger.warn(`❌ No day named '${name}' found in week with ID ${weekId}`);
      return res.status(404).json({ message: `No day named '${name}' found in this week.` });
    }

    return res.status(200).json({ day: week.days[0] });
  } catch (error) {
    logger.error("Error fetching day:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getWeekData = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { weekId } = req.query;
    const user = req.user;
    if (!user) {
      logger.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found" });
    }
    const currentUser = await User.find({ email: user.email });
    if (!currentUser || !currentUser.length) {
      logger.warn("❌ User not found for update operation");
      return res.status(404).json({ message: "User not found." });
    }

    if (!weekId || typeof weekId !== "string") {
      logger.warn("❌ weekId is required for fetching week data");
      return res.status(400).json({ message: "weekId is required." });
    }

    const week = await Week.findById(weekId)
      .select("metadata days")
      .populate({
        path: "days",
        select: "_id name", // only get ID and name of each day
      });

    if (!week) {
      logger.warn(`❌ Week with ID ${weekId} not found`);
      return res.status(404).json({ message: "Week not found." });
    }
    if (currentUser[0]._id.toString() !== week.owner.toString()) {
      logger.warn(`❌ Unauthorized access to week with ID ${weekId} by user ${user.email}`);
      return res.status(403).json({ message: "Unauthorized access to this week." });
    }

    return res.status(200).json({
      metadata: week.metadata,
      days: week.days,
    });
  } catch (error) {
    console.error("Error getting week data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateWeekMetadata = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { weekId } = req.query;
    const { metadata } = req.body;
    const user = req.user;
    if (!user) {
      logger.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found" });
    }
    const currentUser = await User.find({ email: user.email });
    if (!currentUser || !currentUser.length) {
      logger.warn("❌ User not found for update operation");
      return res.status(404).json({ message: "User not found." });
    }

    if (!weekId || typeof weekId !== "string" || typeof metadata !== "string") {
      logger.warn("❌ weekId and metadata are required for updating metadata");
      return res.status(400).json({ message: "Invalid input." });
    }

    const weekExists = await Week.findById(weekId);
    if (!weekExists) {
      logger.warn(`❌ Week with ID ${weekId} not found for metadata update`);
      return res.status(404).json({ message: "Week not found." });
    }
    if (currentUser[0]._id.toString() !== weekExists.owner.toString()) {
      logger.warn(`❌ Unauthorized access to week with ID ${weekId} by user ${user.email}`);
      return res.status(403).json({ message: "Unauthorized access to this week." });
    }

    const week = await Week.findByIdAndUpdate(
      weekExists._id,
      { metadata: metadata.trim() },
      { new: true, select: "-__v -createdAt -updatedAt" }
    );

    if (!week) {
      logger.warn(`❌ Week with ID ${weekId} not found for metadata update`);
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
    const { weekId } = req.query;
    const user = req.user;
    if (!user) {
      logger.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found" });
    }
    const currentUser = await User.find({ email: user.email });
    if (!currentUser || !currentUser.length) {
      logger.warn("❌ User not found for delete operation");
      return res.status(404).json({ message: "User not found." });
    }

    if (!weekId || typeof weekId !== "string") {
      logger.warn("❌ weekId is required for deleting week");
      return res.status(400).json({ message: "weekId is required." });
    }

    const week = await Week.findById(weekId);
    if (!week) {
      logger.warn(`❌ Week with ID ${weekId} not found for deletion`);
      return res.status(404).json({ message: "Week not found." });
    }
    if (currentUser[0]._id.toString() !== week.owner.toString()) {
      logger.warn(`❌ Unauthorized access to week with ID ${weekId} by user ${user.email}`);
      return res.status(403).json({ message: "Unauthorized access to this week." });
    }

    await Day.deleteMany({ _id: { $in: week.days } });
    await week.deleteOne();

    return res.status(200).json({ message: "Week and associated days deleted." });
  } catch (error) {
    console.error("Error deleting week:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const copyWeek = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { weekId } = req.query;
    const user = req.user;
    if (!user) {
      logger.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found" });
    }
    const currentUser = await User.find({ email: user.email });
    if (!currentUser || !currentUser.length) {
      logger.warn("❌ User not found for copy operation");
      return res.status(404).json({ message: "User not found." });
    }

    if (!weekId || typeof weekId !== "string") {
      logger.warn("❌ weekId is required for copying week");
      return res.status(400).json({ message: "weekId is required." });
    }

    const week = await Week.findById(weekId).populate("days");
    if (!week) {
      logger.warn(`❌ Week with ID ${weekId} not found for copying`);
      return res.status(404).json({ message: "Original week not found." });
    }
    if (currentUser[0]._id.toString() !== week.owner.toString()) {
      logger.warn(`❌ Unauthorized access to week with ID ${weekId} by user ${user.email}`);
      return res.status(403).json({ message: "Unauthorized access to this week." });
    }

    const copiedDays = await Promise.all(
      (week.days as IDay[]).map((day) =>
        Day.create({
          name: day.name,
          date: new Date(day.date.getTime()), // new Date instance
          events: [...day.events],
          owner: currentUser[0]._id,
        })
      )
    );

    const newWeek = await Week.create({
      metadata: `${week.metadata || "Copied Week"} - Copy`,
      days: copiedDays.map(d => d._id),
      owner: currentUser[0]._id,
    });

    return res.status(201).json({
      message: "Week copied successfully",
      week: {
        _id: newWeek._id,
        metadata: newWeek.metadata,
      },
    });
  } catch (error) {
    logger.error("Error copying week:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getACompleteWeekData = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { weekId } = req.query;
    const user = req.user;
    if (!user) {
      logger.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found" });
    }
    const currentUser = await User.findOne({ email: user.email });
    if (!currentUser) {
      logger.warn("❌ User not found for fetching complete week data");
      return res.status(404).json({ message: "User not found." });
    }
    if (!weekId || typeof weekId !== "string") {
      logger.warn("❌ weekId is required for fetching complete week data");
      return res.status(400).json({ message: "weekId is required." });
    }
    const week = await Week.findById(weekId)
      .populate({
        path: 'days',
        select: 'name date owner events',
        populate: {
          path: 'events.event',
          model: 'Event',
          select: 'title tag message',
        },
      })
      .select('-__v')
      .lean();
    if (!week) {
      logger.warn(`❌ Week with ID ${weekId} not found for fetching complete data`);
      return res.status(404).json({ message: "Week not found." });
    }
    if (Array.isArray(week) || !week.owner || currentUser._id.toString() !== week.owner.toString()) {
      logger.warn(`❌ Unauthorized access to week with ID ${weekId} by user ${user.email}`);
      return res.status(403).json({ message: "Unauthorized access to this week." });
    }
    const cleanDays = (week.days as any[]).map((day) => ({
      name: day.name,
      date: day.date,
      events: (day.events || []).map((entry: any) => {
        const event = entry.event;
        return event && typeof event === 'object'
          ? {
              title: event.title,
              tag: event.tag,
              message: event.message,
            }
          : null;
      }).filter(Boolean), // remove nulls
    }));

    const cleanWeek = {
      metadata: week.metadata,
      createdAt: week.createdAt,
      updatedAt: week.updatedAt,
      days: cleanDays,
    };

    return res.status(200).json({
      week: cleanWeek,
      message: 'Week data fetched successfully',
    });
  } catch (error) {
    logger.error("Error fetching complete week data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  createWeek,
  getDayByName,
  getWeekData,
  updateWeekMetadata,
  deleteWeek,
  copyWeek,
  createWeekWithDays,
  getACompleteWeekData
};
