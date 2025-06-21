'use client';

import React from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
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

function EventCard({ event }: Props) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div
      onClick={() => router.push(`/dashboard/events/edit-event/${event._id}`)}
      className="group cursor-pointer transition-all duration-200 rounded-xl bg-neutral-850 border border-neutral-700 hover:border-neutral-600 hover:shadow-md hover:shadow-black/10 hover:scale-[1.01] active:scale-[0.99] px-5 py-4"
    >
      {/* Top Row: Title + Chevron */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-white group-hover:text-blue-400 truncate">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-sm text-neutral-400 mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors mt-1" />
      </div>

      {/* Message bubble */}
      {event.message && (
        <div className="mt-4 p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-sm text-neutral-200 leading-relaxed flex items-start gap-2">
          <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p>{event.message}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-4 flex justify-between items-center text-sm text-neutral-500 border-t border-neutral-700 pt-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(event.createdAt)}</span>
          <span className="text-xs text-neutral-600">at {formatTime(event.createdAt)}</span>
        </div>
        <span className="text-xs font-mono text-neutral-600">#{event._id.slice(-6)}</span>
      </div>
    </div>
  );
}

export default EventCard;
