import React from 'react';
import { withDashboardLayout } from '@/components/withDashboardLayout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { List, Clock, Calendar, ArrowRight, TrendingUp, Target, Plus, BarChart3, Timer, Zap } from 'lucide-react';

function Dashboard() {
  const router = useRouter();

  return (
    <div className="text-white px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="mb-12 text-center">

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent mb-4">
          Master Your Time,
          <br />
          <span className="text-3xl sm:text-4xl lg:text-5xl">Achieve Your Goals</span>
        </h1>

        <p className="text-neutral-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
          Your centralized productivity hub designed to streamline task management
          and schedule planning with elegant simplicity.
        </p>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="bg-gradient-to-r from-neutral-800/40 to-neutral-900/40 backdrop-blur-sm border border-neutral-700/30 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-neutral-700/30 rounded-lg">
            <Zap size={20} className="text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
        onClick={()=>router.push("/dashboard/todos/create-todo")}>
          <button className="flex items-center gap-3 bg-neutral-800/50 hover:bg-neutral-700/60 border border-neutral-700/50 hover:border-neutral-600/60 rounded-xl px-4 py-4 transition-all duration-200 group hover:scale-[1.02]">
            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <Plus size={16} className="text-blue-400" />
            </div>
            <span className="text-sm text-neutral-300 group-hover:text-white font-medium">Add Task</span>
          </button>

          <button className="flex items-center gap-3 bg-neutral-800/50 hover:bg-neutral-700/60 border border-neutral-700/50 hover:border-neutral-600/60 rounded-xl px-4 py-4 transition-all duration-200 group hover:scale-[1.02]">
            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <Calendar size={16} className="text-purple-400" />
            </div>
            <span className="text-sm text-neutral-300 group-hover:text-white font-medium">Schedule</span>
          </button>

          <button className="flex items-center gap-3 bg-neutral-800/50 hover:bg-neutral-700/60 border border-neutral-700/50 hover:border-neutral-600/60 rounded-xl px-4 py-4 transition-all duration-200 group hover:scale-[1.02]">
            <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
              <Timer size={16} className="text-orange-400" />
            </div>
            <span className="text-sm text-neutral-300 group-hover:text-white font-medium">Timer</span>
          </button>

          <button className="flex items-center gap-3 bg-neutral-800/50 hover:bg-neutral-700/60 border border-neutral-700/50 hover:border-neutral-600/60 rounded-xl px-4 py-4 transition-all duration-200 group hover:scale-[1.02]">
            <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
              <BarChart3 size={16} className="text-green-400" />
            </div>
            <span className="text-sm text-neutral-300 group-hover:text-white font-medium">Analytics</span>
          </button>
        </div>
      </div>

      {/* Improved Bento Grid Layout */}
      <div className="grid gap-4 sm:gap-6 mb-10">
        {/* Mobile: Single column, Tablet: 2 columns, Desktop: 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Task Manager - Large Card (spans 2 columns on larger screens) */}
          <Link
            href="/dashboard/todos"
            className="group relative sm:col-span-2 lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur border border-neutral-700/50 rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 min-h-[200px] lg:min-h-[280px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20">
                  <List size={28} className="text-blue-400" />
                </div>
                <ArrowRight className="text-neutral-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200" />
              </div>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold mb-2 text-white">Task Manager</h2>
                  <p className="text-neutral-400 text-sm lg:text-base leading-relaxed">
                    Plan, prioritize, and manage tasks with clarity and focus.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-neutral-700/50 text-neutral-300 px-3 py-1.5 rounded-full text-xs font-medium">Due Dates</span>
                  <span className="bg-neutral-700/50 text-neutral-300 px-3 py-1.5 rounded-full text-xs font-medium">Categories</span>
                  <span className="bg-neutral-700/50 text-neutral-300 px-3 py-1.5 rounded-full text-xs font-medium">Reminders</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Timetable Planner - Large Card */}
          <Link
            href="/dashboard/timetable"
            className="group relative sm:col-span-2 lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur border border-neutral-700/50 rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 min-h-[200px] lg:min-h-[280px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-600/10 rounded-xl border border-purple-500/20">
                  <Calendar size={28} className="text-purple-400" />
                </div>
                <ArrowRight className="text-neutral-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-200" />
              </div>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold mb-2 text-white">Timetable Planner</h2>
                  <p className="text-neutral-400 text-sm lg:text-base leading-relaxed">
                    Build routines and weekly plans with structured ease.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-neutral-700/50 text-neutral-300 px-3 py-1.5 rounded-full text-xs font-medium">Weekly View</span>
                  <span className="bg-neutral-700/50 text-neutral-300 px-3 py-1.5 rounded-full text-xs font-medium">Time Blocks</span>
                  <span className="bg-neutral-700/50 text-neutral-300 px-3 py-1.5 rounded-full text-xs font-medium">Recurring</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Second Row - Smaller Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Welcome Back Tile */}
          <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border border-green-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-green-400/40 transition-all duration-300 min-h-[140px]">
            <div className="p-3 bg-green-500/10 rounded-xl mb-3 border border-green-500/20">
              <Zap size={24} className="text-green-400" />
            </div>
            <h3 className="text-white font-semibold mb-1">Welcome Back!</h3>
            <p className="text-neutral-400 text-sm">Ready to be productive?</p>
          </div>

          {/* Quick Timer */}
          <button className="group bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border border-orange-500/20 rounded-2xl p-6 hover:border-orange-400/40 transition-all duration-300 hover:scale-[1.02] min-h-[140px]">
            <div className="flex flex-col items-center justify-center text-center h-full">
              <div className="p-3 bg-orange-500/10 rounded-xl mb-3 border border-orange-500/20 group-hover:bg-orange-500/20 transition-colors">
                <Timer size={24} className="text-orange-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">Quick Timer</h3>
              <p className="text-neutral-400 text-sm">Start focus session</p>
            </div>
          </button>

          {/* Recent Activity */}
          <div className="sm:col-span-2 bg-gradient-to-br from-neutral-800/60 to-neutral-900/60 border border-neutral-700/30 rounded-2xl p-6 min-h-[140px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <TrendingUp size={20} className="text-blue-400" />
              </div>
              <h3 className="text-white font-semibold">Recent Activity</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                <span className="text-neutral-300">Created first todo task</span>
                <span className="text-neutral-500 text-xs ml-auto">2h ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" />
                <span className="text-neutral-300">Scheduled meeting for Monday</span>
                <span className="text-neutral-500 text-xs ml-auto">4h ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0" />
                <span className="text-neutral-300">Updated weekly timetable</span>
                <span className="text-neutral-500 text-xs ml-auto">1d ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Third Row - Pro Tip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="sm:col-span-2 lg:col-span-4 bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border border-yellow-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 flex-shrink-0">
                <Target size={24} className="text-yellow-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-2">💡 Pro Tip</h4>
                <p className="text-neutral-300 text-sm lg:text-base leading-relaxed">
                  Use <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs font-mono border border-neutral-600">Ctrl+N</kbd> to create a new task instantly, or 
                  <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs font-mono border border-neutral-600 ml-1">Ctrl+T</kbd> to start a quick timer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default withDashboardLayout(Dashboard);