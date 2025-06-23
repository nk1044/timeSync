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