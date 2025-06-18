import { Day, IDay } from "@/lib/models/day.model";
import { Week } from "@/lib/models/week.model";
import { NextApiRequest, NextApiResponse } from "next";

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

const createWeekWithDays = async (metadata: string) => {
  try {
    const weekDays = getCurrentWeekDates();
    const createdDays = await Promise.all(
      weekDays.map(({ name, date }) => Day.create({ name, date }))
    );
    const newWeek = await Week.create({
      metadata: metadata.trim(),
      days: createdDays.map(day => day._id),
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

const createWeek = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { metadata } = req.body;
    if (!metadata || typeof metadata !== "string") {
      return res.status(400).json({ message: "metadata is required." });
    }

    const newWeekData = await createWeekWithDays(metadata);
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
    console.error("Error creating week:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getDayByName = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { weekId, name } = req.query;

    if (!weekId || typeof weekId !== "string" || !name || typeof name !== "string") {
      return res.status(400).json({ message: "weekId and name are required." });
    }

    const week = await Week.findById(weekId).populate({
      path: "days",
      match: { name: name.toUpperCase() },
      select: "-__v -createdAt -updatedAt",
    });

    if (!week || !week.days.length) {
      return res.status(404).json({ message: `No day named '${name}' found in this week.` });
    }

    return res.status(200).json({ day: week.days[0] });
  } catch (error) {
    console.error("Error fetching day:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getWeekData = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { weekId } = req.query;

    if (!weekId || typeof weekId !== "string") {
      return res.status(400).json({ message: "weekId is required." });
    }

    const week = await Week.findById(weekId)
      .select("metadata days")
      .populate({
        path: "days",
        select: "_id name", // only get ID and name of each day
      });

    if (!week) {
      return res.status(404).json({ message: "Week not found." });
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

const updateWeekMetadata = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { weekId } = req.query;
    const { metadata } = req.body;

    if (!weekId || typeof weekId !== "string" || typeof metadata !== "string") {
      return res.status(400).json({ message: "Invalid input." });
    }

    const week = await Week.findByIdAndUpdate(
      weekId,
      { metadata: metadata.trim() },
      { new: true, select: "-__v -createdAt -updatedAt" }
    );

    if (!week) {
      return res.status(404).json({ message: "Week not found." });
    }

    return res.status(200).json({ message: "Metadata updated", week });
  } catch (error) {
    console.error("Error updating metadata:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteWeek = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { weekId } = req.query;

    if (!weekId || typeof weekId !== "string") {
      return res.status(400).json({ message: "weekId is required." });
    }

    const week = await Week.findById(weekId);
    if (!week) {
      return res.status(404).json({ message: "Week not found." });
    }

    await Day.deleteMany({ _id: { $in: week.days } });
    await week.deleteOne();

    return res.status(200).json({ message: "Week and associated days deleted." });
  } catch (error) {
    console.error("Error deleting week:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const copyWeek = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { weekId } = req.query;

    if (!weekId || typeof weekId !== "string") {
      return res.status(400).json({ message: "weekId is required." });
    }

    const week = await Week.findById(weekId).populate("days");
    if (!week) {
      return res.status(404).json({ message: "Original week not found." });
    }

    const copiedDays = await Promise.all(
      (week.days as IDay[]).map((day) =>
        Day.create({
          name: day.name,
          date: new Date(day.date.getTime()), // new Date instance
          events: [...day.events],
        })
      )
    );

    const newWeek = await Week.create({
      metadata: `${week.metadata || "Copied Week"} - Copy`,
      days: copiedDays.map(d => d._id),
    });

    return res.status(201).json({
      message: "Week copied successfully",
      week: {
        _id: newWeek._id,
        metadata: newWeek.metadata,
      },
    });
  } catch (error) {
    console.error("Error copying week:", error);
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
  createWeekWithDays
};
