'use client';

import { withDashboardLayout } from '@/components/withDashboardLayout';
import React, { useEffect, useState } from 'react';
import TodoCard from '@/components/TodoCard';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/router';
import Loading from '@/components/loading';

interface Todo {
    _id: string;
    title: string;
    description: string;
    status: 'WORK' | 'PERSONAL';
    reminder: string;
    tag: 'IMPORTANT' | 'NOT_IMPORTANT';
    createdAt: string;
    updatedAt: string;
}

function AllTodos() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const response = await axios.get('/api/todos');
                const { message, todo: fetchedTodos } = response.data || {};
                // Show message if available
                if (message) toast.success(message);

                // Validate todos array
                if (!Array.isArray(fetchedTodos)) {
                    toast.error('Invalid data format: todos is not an array.');
                    setTodos([]);
                } else if (fetchedTodos.length === 0) {
                    toast('No todos found.');
                    setTodos([]);
                } else {
                    setTodos(fetchedTodos);
                    //   toast.success(`Fetched ${fetchedTodos.length} todos successfully.`);
                }
            } catch (error: any) {
                const errorMessage =
                    error?.response?.data?.message ||
                    error?.message ||
                    'An unexpected error occurred while fetching todos.';
                toast.error(errorMessage);
                setTodos([]);
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
                <h1 className="text-2xl font-bold">All Todos</h1>
                <button
                    onClick={() => router.push('/dashboard/todos/create-todo')}
                    className="px-5 cursor-pointer py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-lg transition-all"
                >
                    + Create Todo
                </button>
            </div>

            {loading ? (
                <Loading />
            ) : todos.length === 0 ? (
                <p className="text-neutral-400">No todos found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {todos.map((todo) => (
                        <TodoCard key={todo._id} todo={todo} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default withDashboardLayout(AllTodos);
