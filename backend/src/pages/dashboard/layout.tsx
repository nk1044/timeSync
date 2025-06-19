'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import clsx from 'clsx';

function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-900 text-white">
      {/* Sidebar Section */}
      <div
  className={clsx(
    'h-screen overflow-y-auto transition-all duration-300 z-50 lg:relative fixed top-0 left-0',
    {
      'w-60': isOpen,
      'w-16': !isOpen,
      'translate-x-0': isMobileOpen,
      '-translate-x-full lg:translate-x-0': !isMobileOpen,
    }
  )}
>

        {/* Sidebar Header with toggle */}
        <div className="flex items-center justify-between p-4 border-r border-b border-r-neutral-800 border-b-neutral-800">
          <div className="flex h-full items-center space-x-2">
            <div
              className="w-9 h-9 bg-white rounded-xl cursor-pointer flex items-center justify-center"
              onClick={() => setIsOpen(!isOpen)}
            >
              <LayoutDashboard className="w-5 h-5 text-neutral-900" />
            </div>
            {isOpen && (
              <h2 className="text-white text-lg font-semibold">timeSync</h2>
            )}
          </div>

          {/* Mobile toggle button */}
          <button
            className="text-neutral-400 hover:text-white block lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <Sidebar isOpen={isOpen} onNavigate={() => setIsMobileOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 ml-0 lg:ml-0">
        {/* Mobile toggle open */}
        {!isMobileOpen && (
          <div className="p-4 lg:hidden">
            <button
              className="text-white"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        )}

        {children}
      </main>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
}

export default Layout;
