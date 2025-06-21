 interface TimetableDay {
  _id: string;
  name: string;
  date: Date;
  events: any[];
}

interface TimetableWeek {
  _id: string;
  days: TimetableDay[];
}

interface TimetableResponse {
  _id: string;
  title: string;
  description: string;
  status: string;
  lifetime: Date;
  standardWeek: TimetableWeek;
  ongoingWeek: TimetableWeek;
}

interface TimetableFetchedResponse {
  message: string;
  timetable: TimetableResponse;
}

// Define IDay interface (you might need to adjust this based on your actual model)
interface IDay {
  _id: string;
  name: string;
  date: Date;
  events: any[];
}

// Define populated timetable interface
interface PopulatedTimetable {
  _id: string;
  title: string;
  description: string;
  status: string;
  lifetime: Date;
  owner: string;
  standardWeek: {
    _id: string;
    days: IDay[];
  };
  ongoingWeek: {
    _id: string;
    days: IDay[];
  };
}

export type {
    TimetableDay,
    TimetableWeek,
    TimetableResponse,
    TimetableFetchedResponse,
    IDay,
    PopulatedTimetable,
}