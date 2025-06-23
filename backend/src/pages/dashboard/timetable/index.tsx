import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calendar, Clock, Edit } from 'lucide-react';

import { withDashboardLayout } from '@/components/withDashboardLayout';
import Loading from '@/components/tools/loading';
import { WeekData, days, dayNames, hours, EventItemProps } from '@/components/interfaces';
import { EventItem } from '@/components/cards/DayButton';

const WeekCalendar: React.FC = () => {
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [popupEvent, setPopupEvent] = useState<EventItemProps['event'] | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchWeekData = async () => {
      try {
        const { data } = await axios.get('/api/weeks');
        if (data?.message) toast.success(data.message);
        setWeekData(data?.week || null);
        if (!data?.week) toast.error('No week data found');
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to fetch week data');
        setWeekData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekData();
  }, []);

  useEffect(() => {
    // Lock/unlock page scroll when modal is open
    document.body.style.overflow = popupEvent ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [popupEvent]);

  const handleDayEdit = (day: string) => {
    router.push(`/dashboard/timetable/edit-standard-day?day=${day}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen px-4 text-white">
        <Loading />
      </div>
    );
  }

  if (!weekData) {
    return (
      <div className="flex items-center justify-center h-screen px-4 text-white">
        <div className="text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
          <h2 className="mb-2 text-xl font-semibold">No Calendar Data</h2>
          <p className="text-neutral-400">Unable to load week calendar data.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen px-4 py-3 text-white sm:px-6 lg:px-8">
      <div className="flex flex-col h-full max-w-7xl mx-auto">
        <div className="flex-1 bg-neutral-800 rounded-lg grid grid-rows-[auto_1fr]">

          {/* Header */}
          <div className="grid grid-cols-8 border-b border-neutral-700">
            <div className="p-3 bg-neutral-900 border-r border-neutral-700">
              <Clock className="w-4 h-4 text-neutral-400" />
            </div>
            {days.map((day, idx) => (
              <div
                key={day}
                onClick={() => handleDayEdit(day)}
                className="p-3 bg-neutral-900 border-r border-neutral-700 last:border-r-0 text-center cursor-pointer hover:bg-neutral-700 transition"
              >
                <div className="text-sm font-medium">
                  <Edit className="inline w-4 h-4 mr-1 text-neutral-400" />
                  {dayNames[idx]}
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  {weekData[day]?.events?.length || 0} events
                </div>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-8 h-full overflow-hidden relative">
            {/* Time Column */}
            <div className="bg-neutral-900 border-r border-neutral-700">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-[calc(100%/24)] px-3 py-1 border-b border-neutral-700 text-xs text-neutral-400 flex items-center"
                >
                  {hour === 0
                    ? '12 AM'
                    : hour < 12
                    ? `${hour} AM`
                    : hour === 12
                    ? '12 PM'
                    : `${hour - 12} PM`}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {days.map((day) => (
              <div key={day} className="relative bg-neutral-800 border-r border-neutral-700 last:border-r-0">
                {hours.map((hour) => (
                  <div key={hour} className="h-[calc(100%/24)] border-b border-neutral-700" />
                ))}
                <div className="absolute inset-0 p-1">
                  {weekData[day]?.events?.map((e, i) => (
                    <EventItem
                      key={i}
                      event={{
                        title: e.event.title,
                        message: e.event.message,
                        startTime: e.startTime,
                        endTime: e.endTime,
                      }}
                      onClick={() =>
                        setPopupEvent({
                          title: e.event.title,
                          message: e.event.message,
                          startTime: e.startTime,
                          endTime: e.endTime,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popup */}
      {popupEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl p-6 max-w-sm w-[90%] relative text-white">
            <button
              onClick={() => setPopupEvent(null)}
              className="absolute top-2 right-2 cursor-pointer text-neutral-400 hover:text-white"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-2">{popupEvent.title}</h3>
            <p className="text-sm text-neutral-300 mb-2">{popupEvent.message}</p>
            <p className="text-xs text-neutral-500">
              {popupEvent.startTime} – {popupEvent.endTime}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default withDashboardLayout(WeekCalendar);
