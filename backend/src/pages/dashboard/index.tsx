'use client';

import React from 'react';
import { withDashboardLayout } from '@/components/withDashboardLayout';
import Link from 'next/link';
import { List, Table } from 'lucide-react';

function Dashboard() {
  return (
    <div className="text-white px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome to timeSync</h1>
        <p className="text-neutral-400 mt-2 text-lg">
          Your centralized place to manage tasks and schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Todos Card */}
        <Link
          href="/dashboard/todos"
          className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl p-6 transition-all duration-200 shadow-md group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-neutral-700 rounded-full text-white">
              <List size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold group-hover:text-white transition-colors">
                Task Manager
              </h2>
              <p className="text-neutral-400 text-sm mt-1">
                Create and track your todos efficiently.
              </p>
            </div>
          </div>
        </Link>

        {/* Timetable Card */}
        <Link
          href="/dashboard/timetable"
          className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl p-6 transition-all duration-200 shadow-md group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-neutral-700 rounded-full text-white">
              <Table size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold group-hover:text-white transition-colors">
                Timetable Planner
              </h2>
              <p className="text-neutral-400 text-sm mt-1">
                Organize your schedule and stay on top of your week.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default withDashboardLayout(Dashboard);
