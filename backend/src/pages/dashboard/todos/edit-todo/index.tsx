import { withDashboardLayout } from '@/components/withDashboardLayout';
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/router';

function MissingIdPage() {
    const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-500/10 text-yellow-400 p-4 rounded-full">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">
          Todo ID Missing
        </h1>
        <p className="text-neutral-400 text-sm">
          An ID is required to edit a todo item. Please go back and select a valid item to edit.
        </p>
        <button className='mt-6 px-5 py-2 border border-neutral-700 cursor-pointer text-neutral-300 font-medium rounded-lg transition-all'
          onClick={() => router.replace('/dashboard/todos')}>
          <span className="mr-2">←</span>
            Go Back
        </button>
      </div>
    </div>
  );
}

export default withDashboardLayout(MissingIdPage);
