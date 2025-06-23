import React from 'react';
import { EventItemProps, getEventPosition } from '../interfaces';

export const EventItem: React.FC<EventItemProps> = ({ event, onClick }) => {
  const { top, height } = getEventPosition(event.startTime, event.endTime);

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        top,
        height,
      }}
      className="bg-neutral-600 rounded-md px-2 py-1 text-xs text-white cursor-pointer overflow-hidden w-full"
    >
      <div className="font-semibold truncate">{event.title}</div>
      <div className="text-[10px] text-white/80 truncate">{event.message}</div>
    </div>
  );
};
