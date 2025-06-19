'use client';

import { withDashboardLayout } from '@/components/withDashboardLayout';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast, {Toaster} from 'react-hot-toast';


const defaultData = {
  title: '',
  description: '',
  status: 'PERSONAL',
  reminder: '',
  tag: 'NOT_IMPORTANT',
};

function CreateTodo() {
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
      const response = await axios.post('/api/todos', formData);
      const { message, todo } = response.data || {};

      if (!todo) {
        toast.error('Failed to create todo. Please try again.');
        return;
      }

      toast.success(message || 'Todo created successfully!');
      router.push('/dashboard/todos');
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

  const statusOptions = [
    { value: 'PERSONAL', label: 'Personal', icon: '👤' },
    { value: 'EVENT', label: 'Event', icon: '📅' },
    { value: 'TASK', label: 'Task', icon: '✅' },
  ];

  const tagOptions = [
    { value: 'IMPORTANT', label: 'Important', color: 'text-red-400' },
    { value: 'NOT_IMPORTANT', label: 'Not Important', color: 'text-gray-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800">
      <Toaster 
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#262626',
            color: '#fff',
            border: '1px solid #404040',
          },
        }}
      />

      {/* Header Section */}
      <div className="px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Create New Todo</h1>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Organize your tasks and stay productive. Add all the details to keep track of what matters most.
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-2xl shadow-2xl p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title Field */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-neutral-200">
                  <span className="mr-2">📝</span>
                  Title
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="What needs to be done?"
                  className="w-full px-5 py-4 bg-neutral-900/80 text-white rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder-neutral-500"
                />
              </div>

              {/* Description Field */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-neutral-200">
                  <span className="mr-2">📄</span>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add more details about this todo..."
                  rows={5}
                  className="w-full px-5 py-4 bg-neutral-900/80 text-white rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder-neutral-500 resize-none"
                />
              </div>

              {/* Status & Tag Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status */}
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-semibold text-neutral-200">
                    <span className="mr-2">🏷️</span>
                    Status
                  </label>
                  <div className="relative">
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-neutral-900/80 text-white rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Priority Tag */}
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-semibold text-neutral-200">
                    <span className="mr-2">⚡</span>
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      name="tag"
                      value={formData.tag}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-neutral-900/80 text-white rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                    >
                      {tagOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reminder Field */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-neutral-200">
                  <span className="mr-2">⏰</span>
                  Set Reminder
                </label>
                <input
                  type="datetime-local"
                  name="reminder"
                  value={formData.reminder}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-neutral-900/80 text-white rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/todos')}
                  className="flex items-center justify-center px-8 py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-xl transition-all duration-200 border border-neutral-600"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25 flex-1 sm:flex-initial"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Todo
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

export default withDashboardLayout(CreateTodo);