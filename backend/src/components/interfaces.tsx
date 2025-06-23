export interface Event {
    _id: string;
    title: string;
    tag: string;
    message: string;
    description: string;
    notes: string[];
    owner: string;
}

export interface DayEvent {
    _id: string;
    event: Event;
    startTime: string;
    endTime: string;
    reminderTime: number;
}

export interface DayData {
    events: DayEvent[];
}

export interface ApiResponse {
    day: DayData;
    message: string;
}

export interface AvailableEvent {
    _id: string;
    title: string;
    tag: string;
    message: string;
    createdAt: string;
    updatedAt: string;
}


export interface WeekEvent {
  event: Event;
  startTime: string;
  endTime: string;
  reminderTime?: number;
}

export interface EventItemProps {
  event: {
    title: string;
    message: string;
    startTime: string;
    endTime: string;
  };
  onClick: () => void;
}


export type DayKey = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

type WeekDays = {
  [key in DayKey]: DayData;
};

export interface WeekData extends WeekDays {
  _id: string;
  metadata: string;
  owner: string;
}

export const days: DayKey[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
export const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const hours = Array.from({ length: 24 }, (_, i) => i);

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const getEventPosition = (startTime: string, endTime: string) => {
  const startMinutes = timeToMinutes(startTime);
  const duration = timeToMinutes(endTime) - startMinutes;
  return {
    top: `${(startMinutes / 60) * 2.5}rem`,
    height: `${(duration / 60) * 2.5}rem`,
  };
};


export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
};


export interface AllEventsResponse {
    message: string;
    events: AvailableEvent[];
}

export interface AddEventFormData {
    eventId: string;
    startTime: string;
    endTime: string;
    reminderTime: number;
}

export const fetchAvailableEvents = async (): Promise<AvailableEvent[]> => {
    try {
        const res = await fetch('/api/events');
        const data: AllEventsResponse = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Failed to fetch events');
        }

        return data.events;
    } catch (err) {
        console.error('Failed to fetch available events:', err);
        return [];
    }
};

export const handleRemoveEvent = async (eventIndex: number, dayName: string) => {
    if (window.confirm('Are you sure you want to remove this event?')) {
        try {
            const res = await fetch(`/api/weeks/remove-event?dayName=${dayName}&eventindex=${eventIndex}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to remove event');
            }

            // Refresh the day data after successful deletion
            const dayRes = await fetch(`/api/weeks/get-day-by-name?name=${dayName}`);
            const dayData: ApiResponse = await dayRes.json();

            if (dayRes.ok) {
                return dayData.day;
            }
        } catch (err) {
            console.error('Failed to remove event:', err);
            alert('Failed to remove event. Please try again.');
        }
    }
};