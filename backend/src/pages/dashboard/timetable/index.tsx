import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Edit3 } from 'lucide-react';
import { withDashboardLayout } from '@/components/withDashboardLayout';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loading from '@/components/tools/loading';

interface Event {
  _id: string;
  title: string;
  description: string;
  tag: 'CLASS' | 'PERSONAL';
  message: string;
  notes: string[];
  owner: string;
}

interface WeekEvent {
  event: Event;
  startTime: string;
  endTime: string;
  reminderTime?: number;
}

interface DayData {
  events: WeekEvent[];
}

interface WeekData {
  SUNDAY: DayData;
  MONDAY: DayData;
  TUESDAY: DayData;
  WEDNESDAY: DayData;
  THURSDAY: DayData;
  FRIDAY: DayData;
  SATURDAY: DayData;
  Sunday: DayData;
  Monday: DayData;
  Tuesday: DayData;
  Wednesday: DayData;
  Thursday: DayData;
  Friday: DayData;
  Saturday: DayData;
  _id: string;
  metadata: string;
  owner: string;
}

const WeekCalendar: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeekData = async () => {
      try {
        const response = await axios.get('/api/timetable/weeks');
        const { message, week } = response.data || {};
        
        // Show success message if available
        if (message) toast.success(message);
        
        // Set the week data
        if (week) {
          setWeekData(week);
        } else {
          toast.error('No week data found');
          setWeekData(null);
        }
      } catch (error: any) {
        const errorMessage = 
          error?.response?.data?.message || 
          error?.message || 
          'An unexpected error occurred while fetching week data.';
        toast.error(errorMessage);
        setWeekData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekData();
  }, []);

  type DayKey = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  const days: DayKey[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours (24 hour format)

  const handleDayEdit = (day: string) => {
    setSelectedDay(day);
    console.log(`Edit ${day}`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 text-white h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Show error state if no data
  if (!weekData) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 text-white h-screen flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Calendar Data</h2>
          <p className="text-neutral-400">Unable to load week calendar data.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getEventPosition = (startTime: string, endTime: string) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const duration = endMinutes - startMinutes;
    const startHour = startMinutes / 60;
    
    return {
      top: `${startHour * 2.5}rem`, // 2.5rem per hour to fit 24 hours
      height: `${(duration / 60) * 2.5}rem`
    };
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 text-white h-screen overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-neutral-300" />
              <h1 className="text-2xl font-bold text-white">Week Calendar</h1>
            </div>
            <button className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-lg transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>
          
          {/* Day Navigation */}
          <div className="flex gap-2">
            {days.map((day, index) => (
              <button
                key={day}
                onClick={() => handleDayEdit(day)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                  selectedDay === day 
                    ? 'bg-neutral-700 text-white' 
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                {dayNames[index]}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-neutral-800 rounded-lg overflow-hidden flex-1 min-h-0">
          <div className="grid grid-cols-8 border-b border-neutral-700">
            {/* Time column header */}
            <div className="p-3 bg-neutral-900 border-r border-neutral-700">
              <Clock className="w-4 h-4 text-neutral-400" />
            </div>
            
            {days.map((day, index) => (
              <div key={day} className="p-3 bg-neutral-900 border-r border-neutral-700 last:border-r-0">
                <div className="text-center">
                  <div className="text-sm font-medium text-white">{dayNames[index]}</div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {weekData[day]?.events?.length || 0} events
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-8 relative h-full overflow-y-auto">
            {/* Time column */}
            <div className="border-r border-neutral-700 bg-neutral-900">
              {hours.map((hour) => (
                <div key={hour} className="h-10 px-3 py-1 border-b border-neutral-700 text-xs text-neutral-400 flex items-center">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day) => (
              <div key={day} className="relative border-r border-neutral-700 last:border-r-0 bg-neutral-800">
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div key={hour} className="h-10 border-b border-neutral-700" />
                ))}
                
                {/* Events */}
                <div className="absolute inset-0 p-1">
                  {weekData[day]?.events?.map((weekEvent, index) => {
                    const position = getEventPosition(weekEvent.startTime, weekEvent.endTime);
                    const isClass = weekEvent.event.tag === 'CLASS';
                    
                    return (
                      <div
                        key={index}
                        className={`absolute left-1 right-1 rounded-md p-2 text-xs overflow-hidden ${
                          isClass 
                            ? 'bg-neutral-700 text-white border border-neutral-600' 
                            : 'bg-neutral-600 text-white border border-neutral-500'
                        } hover:shadow-lg transition-all cursor-pointer`}
                        style={position}
                      >
                        <div className="font-medium truncate">
                          {weekEvent.event.title}
                        </div>
                        <div className="text-xs text-neutral-300 mt-1">
                          {formatTime(weekEvent.startTime)} - {formatTime(weekEvent.endTime)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Day Info */}
        {selectedDay && (
          <div className="mt-4 bg-neutral-800 rounded-lg p-4 flex-shrink-0">
            <h3 className="text-lg font-semibold text-white mb-2">
              Editing {selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()}
            </h3>
            <p className="text-neutral-400 text-sm">
              Currently showing {weekData[selectedDay as DayKey]?.events?.length || 0} events for {selectedDay.toLowerCase()}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default withDashboardLayout(WeekCalendar);