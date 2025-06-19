'use client';

import { withDashboardLayout } from '@/components/withDashboardLayout';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Loading from '@/components/loading';
import PopUp from '@/components/popup';

const defaultData = {
  title: '',
  description: '',
  status: 'PERSONAL',
  reminder: '',
  tag: 'NOT_IMPORTANT',
};

function EditTodo() {
  const [formData, setFormData] = useState(defaultData);
  const [initialData, setInitialData] = useState(defaultData);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  // Fetch Todo by ID
  useEffect(() => {
    if (!id) return;

    const fetchTodo = async () => {
      try {
        const res = await axios.get(`/api/todos/${id}`);
        const todo = res.data.todo;

        const formattedReminder = todo.reminder
          ? new Date(todo.reminder).toISOString().slice(0, 16)
          : '';

        const fetchedData = {
          title: todo.title || '',
          description: todo.description || '',
          status: todo.status || 'PERSONAL',
          reminder: formattedReminder,
          tag: todo.tag || 'NOT_IMPORTANT',
        };

        setFormData(fetchedData);
        setInitialData(fetchedData);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to fetch todo.');
      }
    };

    fetchTodo();
  }, [id]);

  const isChanged = JSON.stringify(formData) !== JSON.stringify(initialData);

  // Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChanged) return;

    setLoading(true);
    try {
      const res = await axios.put(`/api/todos/${id}`, formData);
      toast.success(res.data.message || 'Todo updated!');
      setInitialData(formData);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    try {
      const res = await axios.delete(`/api/todos/${id}`);
      toast.success(res.data.message || 'Todo deleted.');
      router.push('/dashboard/todos');
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

  const statusOptions = ['PERSONAL', 'EVENT', 'TASK'];
  const tagOptions = ['IMPORTANT', 'NOT_IMPORTANT'];

  return (
    <div className="min-h-screen px-4 py-10 text-white">
      <Toaster
        toastOptions={{
          style: {
            background: '#1e1e1e',
            color: '#fff',
            border: '1px solid #333',
          },
        }}
      />
      <PopUp
        isOpen={deleting}
        title="Delete Todo"
        message="Are you sure you want to delete this todo? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleting(false)}
      />

      <div className="max-w-screen-sm mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/todos')}
          className="mb-6 flex items-center gap-2 text-neutral-300 hover:text-white transition"
        >
          <ArrowLeft size={18} />
          <span>Back to Todos</span>
        </button>

        <h1 className="text-2xl font-semibold mb-6 text-center">Edit Todo</h1>

        {loading ? (
          <Loading />
        ) : (
          <form
          onSubmit={handleSubmit}
          className="space-y-6 border border-neutral-800 rounded-xl p-6"
        >
          {/* Title */}
          <div>
            <label className="block text-sm mb-1">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full bg-neutral-800 px-4 py-3 rounded border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
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

          {/* Status & Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-neutral-800 px-4 py-3 rounded border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Priority</label>
              <select
                name="tag"
                value={formData.tag}
                onChange={handleChange}
                className="w-full bg-neutral-800 px-4 py-3 rounded border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tagOptions.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="block text-sm mb-1">Reminder</label>
            <input
              type="datetime-local"
              name="reminder"
              value={formData.reminder}
              onChange={handleChange}
              className="w-full bg-neutral-800 px-4 py-3 rounded border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
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

export default withDashboardLayout(EditTodo);
