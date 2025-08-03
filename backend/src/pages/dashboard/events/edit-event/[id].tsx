'use client';

import { withDashboardLayout } from '@/components/withDashboardLayout';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Loading from '@/components/tools/loading';
import PopUp from '@/components/tools/popup';

const defaultData = {
    title: '',
    description: '',
    message: '',
};

function EditEvent() {
    const [formData, setFormData] = useState(defaultData);
    const [initialData, setInitialData] = useState(defaultData);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        if (!id) return;

        const fetchEvent = async () => {
            try {
                const res = await axios.get(`/api/events/${id}`);
                const event = res.data.event;

                const fetchedData = {
                    title: event.title || '',
                    description: event.description || '',
                    message: event.message || '',
                };

                setFormData(fetchedData);
                setInitialData(fetchedData);
            } catch (err: any) {
                toast.error(err?.response?.data?.message || 'Failed to fetch event.');
            }
        };

        fetchEvent();
    }, [id]);

    const isChanged = JSON.stringify(formData) !== JSON.stringify(initialData);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isChanged) return;

        setLoading(true);
        try {
            const res = await axios.put(`/api/events/${id}`, formData);
            toast.success(res.data.message || 'Event updated!');
            setInitialData(formData);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Update failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await axios.delete(`/api/events/${id}`);
            toast.success(res.data.message || 'Event deleted.');
            router.push('/dashboard/events');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Delete failed.');
        } finally {
            setDeleting(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const tagOptions = ['CLASS', 'PERSONAL'];

    return (
        <div className="min-h-screen px-4 py-10 text-white">
            <PopUp
                isOpen={deleting}
                title="Delete Event"
                message="Are you sure you want to delete this event? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleting(false)}
            />

            <div className="max-w-screen-sm mx-auto">
                <button
                    onClick={() => router.push('/dashboard/events')}
                    className="mb-6 flex items-center gap-2 text-neutral-300 hover:text-white transition"
                >
                    <ArrowLeft size={18} />
                    <span>Back to Events</span>
                </button>

                <h1 className="text-2xl font-semibold mb-6 text-center">Edit Event</h1>

                {loading ? (
                    <Loading />
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6 border border-neutral-800 rounded-xl p-6"
                    >
                        <div>
                            <label className="block text-sm mb-1">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full bg-neutral-800 px-4 py-3 rounded border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full bg-neutral-800 px-4 py-3 rounded border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>


                        <div>
                            <label className="block text-sm mb-1">Message</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={3}
                                className="w-full bg-neutral-800 px-4 py-3 rounded border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={!isChanged || loading}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded disabled:opacity-50"
                            >
                                <Save size={18} />
                                Save Changes
                            </button>

                            <button
                                type="button"
                                onClick={() => setDeleting(true)}
                                disabled={deleting}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 cursor-pointer text-white py-3 px-6 rounded disabled:opacity-50"
                            >
                                <Trash2 size={18} />
                                Delete
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default withDashboardLayout(EditEvent);
