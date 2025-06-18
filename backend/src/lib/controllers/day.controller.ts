import { Day } from "@/lib/models/day.model";
import { NextApiRequest, NextApiResponse } from "next";

const createDay = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { name, date } = req.body;
    if (!name || !date) {
      return res.status(400).json({ message: "Name and date are required." });
    }
    const newDay = await Day.create({
      name: name.toUpperCase(),
      date: date,
    });
    if (!newDay) {
      return res.status(500).json({ message: "Failed to create day." });
    }
    const dayData = await Day.findById(newDay._id).select("-__v -createdAt -updatedAt -events");
    return res.status(201).json({ message: "Day created successfully", day: dayData });
  } catch (error) {
    console.error("Error creating day:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllDays = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const days = await Day.find().select("-__v -createdAt -updatedAt -events");
    if (!days || days.length === 0) {
      return res.status(404).json({ message: "No days found." });
    }
    return res.status(200).json({ message: "Days retrieved successfully", days });
  } catch (error) {
    console.error("Error retrieving days:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getDayById = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid or missing Day ID." });
    }

    const day = await Day.findById(id).select("-__v -events");
    if (!day) {
      return res.status(404).json({ message: "Day not found." });
    }

    return res.status(200).json({ message: "Day retrieved successfully", day });
  } catch (error) {
    console.error("Error fetching day:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateDay = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    const { name, date } = req.body;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid or missing Day ID." });
    }

    const updatedDay = await Day.findByIdAndUpdate(
      id,
      { name, date },
      { new: true, runValidators: true }
    ).select("-__v -events");

    if (!updatedDay) {
      return res.status(404).json({ message: "Day not found." });
    }

    return res.status(200).json({ message: "Day updated successfully", day: updatedDay });
  } catch (error) {
    console.error("Error updating day:", error);
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

const addEventToDay = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    const { event, startTime, endTime, reminderTime } = req.body;

    if (!id || typeof id !== "string" || !event || !startTime || !endTime) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    if (!isValidTimeString(startTime)) {
      return res
        .status(400)
        .json({ message: "startTime must be in HH:MM format" });
    }
    if (!isValidTimeString(endTime)) {
      return res
        .status(400)
        .json({ message: "endTime must be in HH:MM format" });
    }
    if (!isEndTimeAfterStartTime(startTime, endTime)) {
      return res.status(400).json({
        message: `endTime (${endTime}) must be after startTime (${startTime})`,
      });
    }
    const day = await Day.findById(id);
    if (!day) {
      return res.status(404).json({ message: "Day not found." });
    }
    day.events.push({ event, startTime, endTime, reminderTime });
    await day.save();
    return res
      .status(200)
      .json({ message: "Event added successfully"});
  } catch (error) {
    console.error("Error adding event:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const getEventsOfDay = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid Day ID." });
    }

    const day = await Day.findById(id).populate("events.event", "-__v");
    if (!day) {
      return res.status(404).json({ message: "Day not found." });
    }

    return res.status(200).json({ message: "Events fetched successfully", events: day.events });
  } catch (error) {
    console.error("Error getting events:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteEventFromDay = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { dayId, eventIndex } = req.query;

    if (!dayId || typeof dayId !== "string" || eventIndex === undefined) {
      return res.status(400).json({ message: "Missing dayId or eventIndex." });
    }

    const day = await Day.findById(dayId);
    if (!day) {
      return res.status(404).json({ message: "Day not found." });
    }

    if (day.events.length <= +eventIndex) {
      return res.status(400).json({ message: "Invalid event index." });
    }

    day.events.splice(+eventIndex, 1);
    await day.save();

    return res.status(200).json({ message: "Event deleted successfully", day });
  } catch (error) {
    console.error("Error deleting event:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateEventInDay = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { dayId, eventIndex } = req.query;
    const { event, startTime, endTime, reminderTime } = req.body;

    if (!dayId || typeof dayId !== "string" || eventIndex === undefined) {
      return res.status(400).json({ message: "Missing dayId or eventIndex." });
    }

    const day = await Day.findById(dayId);
    if (!day) {
      return res.status(404).json({ message: "Day not found." });
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

    return res.status(200).json({ message: "Event updated successfully"});
  } catch (error) {
    console.error("Error updating event:", error);
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
