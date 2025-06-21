'use client';

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/router';

interface Event {
  _id: string;
  title: string;
  description: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  event: Event;
}

function EventCard({ event: event }: Props) {
  const router = useRouter();

  return (
    <div
      className="bg-gradient-to-br from-neutral-800/70 to-neutral-900/70 border border-neutral-700/50 rounded-2xl cursor-pointer p-5 flex flex-col gap-4 hover:border-neutral-600/60 transition-all duration-300"
      onClick={() => router.push(`/dashboard/events/edit-event/${event._id}`)}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
        </div>
      </div>

      {/* Reminder & Tag */}
      <div className="flex items-center justify-between text-sm text-neutral-300">
      {event.message && (
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-neutral-400" />
          <span className="text-neutral-200">{event.message}</span> 
        </div>
      )}
    </div>
        <div className="flex items-center justify-between text-sm text-neutral-300">
            <div className="flex items-center gap-2">
            <Calendar size={16} className="text-neutral-400" />
            <span className="text-neutral-200">
                {new Date(event.createdAt).toLocaleDateString()}
            </span>
            </div>
        </div>
    </div>
  );
}

export default EventCard;
