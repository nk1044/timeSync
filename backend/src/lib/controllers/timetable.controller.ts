import { TimeTable } from "../models/timetable.model";
import { NextApiRequest, NextApiResponse } from "next";
import { createWeekWithDays } from "./week.controller";
import { Day } from "../models/day.model";
import { Week } from "../models/week.model";

const createTimeTable = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { title, description, status, lifetime } = req.body;

    if (
      typeof title !== "string" ||
      typeof status !== "string" ||
      typeof lifetime !== "string"
    ) {
      return res.status(400).json({ message: "Title, status, and lifetime are required." });
    }

    // Create standard and ongoing weeks with their days
    const [standardWeekResult, ongoingWeekResult] = await Promise.all([
      createWeekWithDays("Standard Week"),
      createWeekWithDays("Ongoing Week"),
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
    console.error("Error creating timetable:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateTimeTableDetails = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    const { title, description, status, lifetime } = req.body;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Timetable ID is required." });
    }

    const timetable = await TimeTable.findById(id);
    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found." });
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

const rotateOngoingWeek = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Timetable ID is required." });
    }

    const timetable = await TimeTable.findById(id).populate("ongoingWeek standardWeek");
    if (!timetable || !timetable.ongoingWeek || !timetable.standardWeek) {
      return res.status(404).json({ message: "Timetable or required weeks not found." });
    }

    const standardWeek = timetable.standardWeek as any;

    // Deep clone days from standardWeek
    const originalDays = await Day.find({ _id: { $in: standardWeek.days } });
    const newDays = await Promise.all(
      originalDays.map(orig =>
        Day.create({ name: orig.name, date: orig.date, events: orig.events })
      )
    );

    // Create new Ongoing Week
    const newOngoingWeek = await Week.create({
      metadata: "Ongoing Week",
      days: newDays.map(day => day._id),
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
    console.error("Error rotating ongoing week:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteTimeTable = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Timetable ID is required." });
    }

    const timetable = await TimeTable.findById(id);
    if (!timetable) {
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
    console.error("Error deleting timetable:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllTimeTables = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const timetables = await TimeTable.find({})
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
    console.error("Error fetching timetables:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export { 
    createTimeTable,
    updateTimeTableDetails,
    rotateOngoingWeek,
    deleteTimeTable,
    getAllTimeTables
};
