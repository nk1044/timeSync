'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { Home, List, Table, Calendar } from 'lucide-react';
import clsx from 'clsx';
import SidebarToolsButton from './tools/SidebarToolsButton';

interface SidebarProps {
  isOpen: boolean;
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onNavigate }) => {
  const router = useRouter();

  const sideBarContent = [
    { title: 'Home', icon: <Home size={20} />, link: '/dashboard' },
    { title: 'Todos', icon: <List size={20} />, link: '/dashboard/todos' },
    { title: 'Events', icon: <Calendar size={20} />, link: '/dashboard/events' },
    { title: 'TimeTable', icon: <Table size={20} />, link: '/dashboard/timetable' },
  ];

  const handleNav = (link: string) => {
    router.push(link);
    onNavigate?.(); // Close mobile sidebar if needed
  };

  return (
    <aside className="relative flex flex-col h-full bg-neutral-900 border-r border-neutral-800 transition-all duration-300 overflow-hidden">
      {/* Scrollable content with bottom padding to avoid overlap */}
      <div className="flex-1 overflow-y-auto px-2 py-4 pb-20 space-y-1">
        {sideBarContent.map((item, idx) => (
          <div
            key={idx}
            onClick={() => handleNav(item.link)}
            className={clsx(
              "flex items-center gap-3 px-3 py-3 text-white hover:bg-neutral-700 rounded-lg cursor-pointer transition-all group",
              router.pathname === item.link && "bg-neutral-700"
            )}
          >
            <div className="text-neutral-300 group-hover:text-white">{item.icon}</div>
            {isOpen && (
              <span className="text-md text-neutral-200 group-hover:text-white transition-colors">
                {item.title}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Absolute positioned tools button at bottom */}
      {isOpen && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800 bg-neutral-900">
          <SidebarToolsButton />
        </div>
      )}
    </aside>
  );
};

export default Sidebar;