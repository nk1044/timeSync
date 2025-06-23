'use client'
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { withDashboardLayout } from '@/components/withDashboardLayout';
import { Plus, Clock, MessageSquare, Trash2, X } from 'lucide-react';
import { DayData, DayEvent, AvailableEvent, AddEventFormData, ApiResponse, fetchAvailableEvents } from '@/components/interfaces';
import toast from 'react-hot-toast';
import axios from 'axios';
import { set } from 'mongoose';

function EditDay() {
    const searchParams = useSearchParams();
    const dayName = searchParams.get('day'); // e.g., 'SUNDAY'

    const [dayData, setDayData] = useState<DayData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [formData, setFormData] = useState<AddEventFormData>({
        eventId: '',
        startTime: '',
        endTime: '',
        reminderTime: 10
    });


    const loadDayData = async () => {
    if (!dayName) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/weeks/get-day-by-name?name=${dayName}`);
      setDayData(data.day);
      toast.success(`Loaded ${dayName.toLowerCase()} schedule successfully!`);
    } catch (err: any) {
      notifyError(err, 'Failed to load day data');
      setDayData(null);
    } finally {
      setLoading(false);
    }
  };

  const notifyError = (err: any, fallback = 'Something went wrong') => {
    const message = err?.response?.data?.message || err?.message || fallback;
    toast.error(message);
  };

  useEffect(() => {
    loadDayData();
  }, [dayName]);

  const handleAddEvent = async () => {
    setShowAddModal(true);
    try {
      const events = await fetchAvailableEvents();
      setAvailableEvents(events);
    } catch (err) {
      notifyError(err, 'Failed to fetch available events');
    }
  };

  const handleRemoveEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to remove this event?')) return;

    try {
      const { data } = await axios.delete(`/api/weeks/remove-event?dayName=${dayName}&eventId=${eventId}`);
      toast.success(data.message || 'Event removed');
      await loadDayData();
    } catch (err) {
      notifyError(err, 'Failed to remove event');
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { eventId, startTime, endTime, reminderTime } = formData;
    if (!eventId || !startTime || !endTime) {
      toast.error('All fields are required');
      return;
    }

    try {
      const res = await axios.post('/api/weeks/add-event-to-day', {
        dayName,
        eventId,
        startTime,
        endTime,
        reminderTime,
      });
      toast.success(res.data.message || 'Event added');
      await loadDayData();
      setShowAddModal(false);
      setFormData({ eventId: '', startTime: '', endTime: '', reminderTime: 10 });
    } catch (err) {
      notifyError(err, 'Failed to add event');
    }
  };

    const getTagColor = (tag: string) => {
        const colors: { [key: string]: string } = {
            'PERSONAL': 'bg-neutral-800 text-blue-400',
            'CLASS': 'bg-neutral-800 text-orange-400',
        };
        return colors[tag] || colors['DEFAULT'];
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return slots;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="text-red-600 font-medium">Error: {error}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 bg-neutral-900 min-h-screen">
            {/* Header */}
            <div className="bg-neutral-800 rounded-lg shadow-sm border border-neutral-700 p-6 mb-6">
                <div className="flex items-center justify-between ">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-300 capitalize">
                            {dayName?.toLowerCase()} Schedule
                        </h1>
                        <p className="text-neutral-400 mt-1">
                            Manage your events for {dayName?.toLowerCase()}
                        </p>
                    </div>
                    <button
                        onClick={handleAddEvent}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus size={20} />
                        Add Event
                    </button>
                </div>
            </div>

            {/* Day Schedule */}
            <div className="bg-neutral-800 rounded-lg shadow-sm border border-neutral-700">
                <div className="p-6 border-b border-neutral-700">
                    <h2 className="text-xl font-semibold text-neutral-300">Today's Events</h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        {dayData?.events?.length || 0} events scheduled
                    </p>
                </div>

                <div className="p-6">
                    {dayData?.events?.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock size={48} className="mx-auto text-neutral-400 mb-4" />
                            <h3 className="text-lg font-medium text-neutral-300 mb-2">No events scheduled</h3>
                            <p className="text-neutral-400 mb-4">Start by adding your first event for {dayName?.toLowerCase()}</p>
                            <button
                                onClick={handleAddEvent}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <Plus size={16} />
                                Add Your First Event
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {dayData?.events
                                ?.map((dayEvent: DayEvent, index: number) => (
                                    <div
                                        key={dayEvent._id}
                                        className="bg-neutral-800 rounded-lg p-6 border border-neutral-700 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-xl font-semibold text-neutral-300">
                                                        {dayEvent.event.title}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTagColor(dayEvent.event.tag)}`}>
                                                        {dayEvent.event.tag}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div className="flex items-center gap-2 text-neutral-300">
                                                        <Clock size={16} className="text-blue-600" />
                                                        <span className="font-medium">
                                                            {dayEvent.startTime} - {dayEvent.endTime}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-neutral-400">
                                                        <MessageSquare size={16} className="text-green-600" />
                                                        <span>{dayEvent.event.message}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleRemoveEvent(dayEvent._id)}
                                                className="ml-4 p-2 text-red-600 hover:bg-neutral-600 rounded-lg transition-colors"
                                                title="Remove Event"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Event Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-neutral-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-neutral-300">Add New Event</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleModalSubmit} className="p-6">
                            <div className="space-y-6">
                                {/* Event Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-3">
                                        Select Event
                                    </label>
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {availableEvents.map((event) => (
                                            <div
                                                key={event._id}
                                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedEventId === event._id
                                                    ? 'border-neutral-400 bg-neutral-700'
                                                    : 'border-neutral-700 hover:border-neutral-600'
                                                    }`}
                                                onClick={() => {
                                                    setSelectedEventId(event._id);
                                                    setFormData({ ...formData, eventId: event._id });
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-medium text-neutral-300">{event.title}</h4>
                                                        <p className="text-sm text-neutral-400 mt-1">{event.message}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTagColor(event.tag)}`}>
                                                        {event.tag}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Time Selection */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">
                                            Start Time
                                        </label>
                                        <select
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                            className="w-full p-3 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
                                            required
                                        >
                                            <option value="">Select start time</option>
                                            {generateTimeSlots().map((time) => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">
                                            End Time
                                        </label>
                                        <select
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full p-3 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
                                            required
                                        >
                                            <option value="">Select end time</option>
                                            {generateTimeSlots().map((time) => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Reminder Time */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                                        Reminder (minutes before)
                                    </label>
                                    <select
                                        value={formData.reminderTime}
                                        onChange={(e) => setFormData({ ...formData, reminderTime: parseInt(e.target.value) })}
                                        className="w-full p-3 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value={5}>5 minutes</option>
                                        <option value={10}>10 minutes</option>
                                        <option value={15}>15 minutes</option>
                                        <option value={30}>30 minutes</option>
                                        <option value={60}>1 hour</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 px-4 border border-neutral-700 rounded-lg text-neutral-400 hover:bg-neutral-600 cursor-pointer transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer rounded-lg transition-colors"
                                >
                                    Add Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default withDashboardLayout(EditDay);