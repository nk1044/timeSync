'use client';

import { withDashboardLayout } from '@/components/withDashboardLayout';
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const defaultData = {
  title: '',
  description: '',
  tag: 'CLASS',
  message: '',
};

function CreateEvent() {
  const [formData, setFormData] = useState(defaultData);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/events', formData);
      const { message, event } = response.data || {};

      if (!event) {
        toast.error('Failed to create event. Please try again.');
        return;
      }

      toast.success(message || 'Event created successfully!');
      router.push('/dashboard/events');
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const tagOptions = [
    { value: 'CLASS', label: 'Class' },
    { value: 'PERSONAL', label: 'Personal' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Create New Event</h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Add details about your upcoming event to stay on track.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-2xl shadow-2xl p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-neutral-200 flex items-center">
                  <span className="mr-2">📝</span> Title <span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Event title"
                  className="w-full px-5 py-4 bg-neutral-900/80 text-white rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 placeholder-neutral-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-neutral-200 flex items-center">
                  <span className="mr-2">📄</span> Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add more details about this event..."
                  rows={5}
                  className="w-full px-5 py-4 bg-neutral-900/80 text-white rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 placeholder-neutral-500 resize-none"
                />
              </div>

              {/* Tag */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-neutral-200 flex items-center">
                  <span className="mr-2">🏷️</span> Tag
                </label>
                <select
                  name="tag"
                  value={formData.tag}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-neutral-900/80 text-white rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none"
                >
                  {tagOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-neutral-200 flex items-center">
                  <span className="mr-2">💬</span> Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Event message or notes..."
                  rows={3}
                  className="w-full px-5 py-4 bg-neutral-900/80 text-white rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 placeholder-neutral-500 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/events')}
                  className="flex items-center justify-center px-8 py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-xl border border-neutral-600 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25 flex-1 sm:flex-initial disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Event
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withDashboardLayout(CreateEvent);
