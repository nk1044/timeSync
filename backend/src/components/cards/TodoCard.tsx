'use client';

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/router';

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

interface Props {
  todo: Todo;
}

function TodoCard({ todo }: Props) {
  const router = useRouter();
  const formattedDate = new Date(todo.reminder).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const statusColor = {
    WORK: 'bg-blue-500/20 text-blue-400',
    PERSONAL: 'bg-green-500/20 text-green-400',
  };

  const tagColor = {
    IMPORTANT: 'bg-red-500/20 text-red-400',
    NOT_IMPORTANT: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div
      className="bg-gradient-to-br from-neutral-800/70 to-neutral-900/70 border border-neutral-700/50 rounded-2xl cursor-pointer p-5 flex flex-col gap-4 hover:border-neutral-600/60 transition-all duration-300"
      onClick={() => router.push(`/dashboard/todos/edit-todo/${todo._id}`)}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-white">{todo.title}</h3>
        </div>
        {/* Status */}
        <span
          className={clsx(
            'text-xs font-medium px-3 py-1 rounded-sm',
            statusColor[todo.status]
          )}
        >
          {todo.status}
        </span>
      </div>

      {/* Reminder & Tag */}
      <div className="flex items-center justify-between text-sm text-neutral-300">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-orange-400" />
          <span>{formattedDate}</span>
        </div>
        <span
          className={clsx(
            'text-xs font-medium px-3 py-1 rounded-sm',
            tagColor[todo.tag]
          )}
        >
          {todo.tag.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}

export default TodoCard;
