'use client';

import { useRouter } from 'next/router';
import { ArrowLeft, Cog, Home, Moon, Keyboard } from 'lucide-react';
import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';

const SidebarToolsButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleGoHome = () => {
    setIsOpen(false);
    router.push('/');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-300 rounded-lg transition"
      >
        <Cog size={18} />
        <span>Tools / Shortcuts</span>
      </button>

      {/* Modal */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-xl bg-neutral-900 text-white shadow-lg border border-neutral-700 p-6 space-y-4">
            <Dialog.Title className="text-lg font-semibold mb-2">Tools & Shortcuts</Dialog.Title>

            <div className="space-y-3">
              <button
                onClick={handleGoHome}
                className="w-full flex items-center gap-3 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md text-sm transition"
              >
                <Home size={18} />
                <span>Go to Landing Page</span>
              </button>

              <button
                onClick={() => {
                  document.documentElement.classList.toggle('dark');
                  localStorage.theme =
                    document.documentElement.classList.contains('dark') ? 'dark' : 'light';
                }}
                className="w-full flex items-center gap-3 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md text-sm transition"
              >
                <Moon size={18} />
                <span>Toggle Dark Mode</span>
              </button>

              <button
                onClick={() => alert('Show shortcut keys here')}
                className="w-full flex items-center gap-3 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md text-sm transition"
              >
                <Keyboard size={18} />
                <span>View Keyboard Shortcuts</span>
              </button>
            </div>

            <div className="pt-4 text-right">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-neutral-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default SidebarToolsButton;
