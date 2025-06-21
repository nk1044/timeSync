'use client';

import { withDashboardLayout } from '@/components/withDashboardLayout';
import React, { useEffect, useState } from 'react';
import TodoCard from '@/components/TodoCard';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/router';
import Loading from '@/components/loading';
import EventCard from '@/components/EventCard';

interface Event {
  _id: string;
  title: string;
  description: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

function AllTodos() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const response = await axios.get('/api/events');
                const { message, events: fetchedEvents } = response.data || {};
                // Show message if available
                if (message) toast.success(message);

                // Validate todos array
                if (!Array.isArray(fetchedEvents)) {
                    toast.error('Invalid data format: event is not an array.');
                    setEvents([]);
                } else if (fetchedEvents.length === 0) {
                    toast('No todos found.');
                    setEvents([]);
                } else {
                    setEvents(fetchedEvents);
                    //   toast.success(`Fetched ${fetchedTodos.length} todos successfully.`);
                }
            } catch (error: any) {
                const errorMessage =
                    error?.response?.data?.message ||
                    error?.message ||
                    'An unexpected error occurred while fetching todos.';
                toast.error(errorMessage);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTodos();
    }, []);

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 text-white">
            <Toaster />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">All Events</h1>
                <button
                    onClick={() => router.push('/dashboard/events/create-event')}
                    className="px-5 cursor-pointer py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-lg transition-all"
                >
                    + Create Event
                </button>
            </div>

            {loading ? (
                <Loading />
            ) : events.length === 0 ? (
                <p className="text-neutral-400">No Event found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <EventCard key={event._id} event={event} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default withDashboardLayout(AllTodos);
