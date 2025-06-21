import { TimeTable } from "../models/timetable.model";
import { NextApiRequest, NextApiResponse } from "next";
import { createWeekWithDays } from "./week.controller";
import { Day, IDay } from "../models/day.model";
import { Week } from "../models/week.model";
import { AuthenticatedRequest, User } from '@/lib/models/user.model';
import { logger } from "../config/logger";
import { PopulatedTimetable, TimetableDay, TimetableFetchedResponse } from "./interfaces";



const createTimeTable = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { title, description, status, lifetime } = req.body;
    const user = req.user;
    if (!user) {
      logger.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found" });
    }
    const currentUser = await User.findOne({ email: user.email });
    if (
      typeof title !== "string" ||
      typeof status !== "string" ||
      typeof lifetime !== "string"
    ) {
      return res.status(400).json({ message: "Title, status, and lifetime are required." });
    }

    // Create standard and ongoing weeks with their days
    const [standardWeekResult, ongoingWeekResult] = await Promise.all([
      createWeekWithDays("Standard Week", currentUser),
      createWeekWithDays("Ongoing Week", currentUser),
    ]);

    if (!standardWeekResult || !ongoingWeekResult) {
      return res.status(500).json({ message: "Failed to create weeks with days." });
    }

    const { newWeek: standardWeek } = standardWeekResult;
    const { newWeek: ongoingWeek } = ongoingWeekResult;

    // Create the timetable document
    const newTimeTable = await TimeTable.create({
      title: title.trim(),
      description: description?.trim() || "",
      status: status.trim().toUpperCase(),
      lifetime: new Date(lifetime),
      owner: currentUser._id,
      standardWeek: standardWeek._id,
      ongoingWeek: ongoingWeek._id,
    });

    return res.status(201).json({
      message: "Timetable created successfully",
      timetable: {
        _id: newTimeTable._id,
        title: newTimeTable.title,
        description: newTimeTable.description,
        status: newTimeTable.status,
        lifetime: newTimeTable.lifetime,
        standardWeek: standardWeek._id,
        ongoingWeek: ongoingWeek._id,
      },
    });
  } catch (error) {
    logger.error("Error creating timetable:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getATimeTableByID = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    const user = req.user;
    logger.info(`Fetching timetable with ID: ${id}, User: ${user}`);
    if (!user) {
      logger.warn("❌ Unauthorized Request, user not found");
      return res.status(401).json({ message: "Unauthorized Request, user not found or token may not be valid" });
    }
    
    const currentUser = await User.findOne({ email: user.email });
    if (!currentUser) {
      logger.warn("❌ User not found for fetching timetable");
      return res.status(404).json({ message: "User not found." });
    }
    if (!id) {
      logger.warn("❌ Timetable ID is required for fetching");
      return res.status(400).json({ message: "Timetable ID is required." });
    }
    
    const timetable = await TimeTable.findById(id);
    if (!timetable) {
      logger.warn(`❌ Timetable with ID ${id} not found`);
      return res.status(404).json({ message: "Timetable not found." });
    }
    
    if (timetable.owner.toString() !== currentUser._id.toString()) {
      logger.warn(`❌ User ${currentUser._id} does not have permission to access timetable ${id}`);
      return res.status(403).json({ message: "You do not have permission to access this timetable." });
    }

    const response = {
      message: "Timetable fetched successfully",
      timetable: {
        _id: timetable._id,
        title: timetable.title,
        description: timetable.description,
        status: timetable.status,
        lifetime: timetable.lifetime,
        standardWeek: timetable.standardWeek._id,
        ongoingWeek: timetable.ongoingWeek._id,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    // logger.error(`Error fetching timetable by ID: ${error}`);
    console.error(`Error fetching timetable by ID: ${error}`);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateTimeTableDetails = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    const { title, description, status, lifetime } = req.body;
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

    if (!id || typeof id !== "string") {
      logger.warn("❌ Timetable ID is required for update operation");
      return res.status(400).json({ message: "Timetable ID is required." });
    }

    const timetable = await TimeTable.findById(id);
    if (!timetable) {
      logger.warn(`❌ Timetable with ID ${id} not found for update operation`);
      return res.status(404).json({ message: "Timetable not found." });
    }
    if (timetable.owner.toString() !== currentUser._id.toString()) {
      logger.warn(`❌ User ${currentUser._id} does not have permission to update timetable ${id}`);
      return res.status(403).json({ message: "You do not have permission to update this timetable." });
    }

    if (typeof title === "string") timetable.title = title.trim();
    if (typeof description === "string") timetable.description = description.trim();
    if (typeof status === "string") timetable.status = status.trim().toUpperCase();
    if (typeof lifetime === "string" || lifetime instanceof Date) {
      const date = new Date(lifetime);
      if (!isNaN(date.getTime())) {
        timetable.lifetime = date;
      }
    }

    await timetable.save();

    return res.status(200).json({
      message: "Timetable updated successfully",
      timetable: {
        _id: timetable._id,
        title: timetable.title,
        description: timetable.description,
        status: timetable.status,
        lifetime: timetable.lifetime,
      },
    });
  } catch (error) {
    console.error("Error updating timetable:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const rotateOngoingWeek = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
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
    if (!id || typeof id !== "string") {
      logger.warn("❌ Timetable ID is required for ongoing week rotation");
      return res.status(400).json({ message: "Timetable ID is required." });
    }

    const timetable = await TimeTable.findById(id).populate("ongoingWeek standardWeek");
    if (!timetable || !timetable.ongoingWeek || !timetable.standardWeek) {
      logger.warn(`❌ Timetable with ID ${id} or its required weeks not found for ongoing week rotation`);
      return res.status(404).json({ message: "Timetable or required weeks not found." });
    }
    if (timetable.owner.toString() !== currentUser[0]._id.toString()) {
      logger.warn(`❌ User ${currentUser[0]._id} does not have permission to rotate ongoing week for timetable ${id}`);
      return res.status(403).json({ message: "You do not have permission to rotate the ongoing week." });
    }

    const standardWeek = timetable.standardWeek as any;

    // Deep clone days from standardWeek
    const originalDays = await Day.find({ _id: { $in: standardWeek.days } });
    const newDays = await Promise.all(
      originalDays.map(orig =>
        Day.create({ 
          name: orig.name, 
          date: orig.date, 
          events: orig.events,
          owner: currentUser._id
        })
      )
    );

    // Create new Ongoing Week
    const newOngoingWeek = await Week.create({
      metadata: "Ongoing Week",
      days: newDays.map(day => day._id),
      owner: currentUser._id,
    });

    // Optional: store history
    if (!timetable.weekHistory) timetable.weekHistory = [];
    timetable.weekHistory.push(timetable.ongoingWeek._id);

    // Update timetable with new ongoing week
    timetable.ongoingWeek = newOngoingWeek._id;
    await timetable.save();

    return res.status(200).json({
      message: "Ongoing week rotated successfully",
      updated: {
        _id: timetable._id,
        standardWeek: timetable.standardWeek._id,
        ongoingWeek: newOngoingWeek._id,
      },
    });
  } catch (error) {
    logger.error(`Error rotating ongoing week: ${error}`);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteTimeTable = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
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
    if (!id || typeof id !== "string") {
      logger.warn("❌ Timetable ID is required for deletion");
      return res.status(400).json({ message: "Timetable ID is required." });
    }

    const timetable = await TimeTable.findById(id);
    if (!timetable) {
      logger.warn(`❌ Timetable with ID ${id} not found for deletion`);
      return res.status(404).json({ message: "Timetable not found." });
    }

    const weekIdsToDelete = [timetable.standardWeek, timetable.ongoingWeek];

    // If there's week history, also remove it
    if (Array.isArray(timetable.weekHistory)) {
      weekIdsToDelete.push(...timetable.weekHistory);
    }

    // Fetch all week docs to collect their days
    const weeks = await Week.find({ _id: { $in: weekIdsToDelete } });
    const allDayIds = weeks.flatMap(week => week.days);

    // Delete all referenced Days
    await Day.deleteMany({ _id: { $in: allDayIds } });

    // Delete all Weeks
    await Week.deleteMany({ _id: { $in: weekIdsToDelete } });

    // Delete the timetable
    await timetable.deleteOne();

    return res.status(200).json({
      message: "Timetable and associated weeks/days deleted successfully.",
      deletedId: id,
    });
  } catch (error) {
    logger.error("Error deleting timetable:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllTimeTables = async (req: AuthenticatedRequest, res: NextApiResponse) => {
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
    const timetables = await TimeTable.find({owner: currentUser._id})
      .select("title description status lifetime standardWeek ongoingWeek")
      .lean();

    const sanitizedTimetables = timetables.map(t => ({
      _id: t._id,
      title: t.title,
      description: t.description,
      status: t.status,
      lifetime: t.lifetime,
      standardWeek: t.standardWeek?._id || t.standardWeek,
      ongoingWeek: t.ongoingWeek?._id || t.ongoingWeek,
    }));

    return res.status(200).json({
      message: "Timetables fetched successfully",
      timetables: sanitizedTimetables,
    });
  } catch (error) {
    logger.error("Error fetching timetables:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export {
  createTimeTable,
  updateTimeTableDetails,
  rotateOngoingWeek,
  deleteTimeTable,
  getAllTimeTables,
  getATimeTableByID
};
