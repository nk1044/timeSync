import { withDashboardLayout } from '@/components/withDashboardLayout';
import TimetableCard from '@/components/cards/timetable_card';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, RefreshCw } from 'lucide-react';
import Loading from '@/components/tools/loading';

interface Timetable {
  _id: string;
  title: string;
  description: string;
  status: string;
  lifetime: string;
  standardWeek: string;
  ongoingWeek: string;
}

function TimetableIndex() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTimetables = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
      }
      
      const response = await fetch('/api/timetable');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.message && data.timetables) {
        toast.success(data.message);
        setTimetables(data.timetables);
        if (showRefreshToast) {
          toast.success('Timetables refreshed successfully');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching timetables:', error);
      toast.error(
        error instanceof Error 
          ? `Failed to fetch timetables: ${error.message}` 
          : 'Failed to fetch timetables'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, []);

  const handleCardClick = (id: string) => {
    // Handle navigation to specific timetable
    console.log('Navigate to timetable:', id);
    // You can add navigation logic here
    // router.push(`/dashboard/timetable/${id}`);
  };

  const handleRefresh = () => {
    fetchTimetables(true);
  };

  if (loading) {
    return (
      <Loading/>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Timetables</h1>
          <p className="text-neutral-400 mt-1">
            Manage your schedules and time blocks
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            <span>New Timetable</span>
          </button>
        </div>
      </div>

      {/* Timetables Grid */}
      {timetables.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-neutral-800 rounded-lg border border-neutral-700">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-neutral-700 rounded-full flex items-center justify-center mx-auto">
              <Plus className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-white">No timetables found</h3>
            <p className="text-neutral-400 max-w-sm">
              Get started by creating your first timetable to organize your schedule.
            </p>
            <button className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
              Create Timetable
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {timetables.map((timetable) => (
            <TimetableCard
              key={timetable._id}
              timetable={timetable}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {/* Footer info */}
      {timetables.length > 0 && (
        <div className="text-center text-sm text-neutral-500 pt-4 border-t border-neutral-800">
          Showing {timetables.length} timetable{timetables.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default withDashboardLayout(TimetableIndex);