'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import clsx from 'clsx';

function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-900 text-white overflow-hidden">
      {/* Sidebar Section */}
      <div
        className={clsx(
          'h-full flex flex-col transition-all duration-300 z-50 lg:relative fixed top-0 left-0',
          {
            'w-60': isOpen,
            'w-16': !isOpen,
            'translate-x-0': isMobileOpen,
            '-translate-x-full lg:translate-x-0': !isMobileOpen,
          }
        )}
      >
        {/* Sidebar Header with toggle - Fixed height */}
        <div className="flex items-center justify-between p-4 border-r border-b border-r-neutral-800 border-b-neutral-800 bg-neutral-900 flex-shrink-0">
          <div className="flex h-full items-center space-x-2">
            <div
              className="w-9 h-9 bg-white rounded-xl cursor-pointer flex items-center justify-center hover:bg-neutral-100 transition-colors"
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
            className="text-neutral-400 hover:text-white block lg:hidden transition-colors"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Content - Takes remaining height */}
        <div className="flex-1 min-h-0">
          <Sidebar isOpen={isOpen} onNavigate={() => setIsMobileOpen(false)} />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile toggle open */}
        {!isMobileOpen && (
          <div className="p-4 lg:hidden border-b border-neutral-800">
            <button
              className="text-white hover:text-neutral-300 transition-colors"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        )}

        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
}

export default Layout;