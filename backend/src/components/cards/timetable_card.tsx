import React from 'react';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

interface TimetableCardProps {
  timetable: {
    _id: string;
    title: string;
    description: string;
    status: string;
    lifetime: string;
    standardWeek: string;
    ongoingWeek: string;
  };
  onClick?: (id: string) => void;
}

const TimetableCard: React.FC<TimetableCardProps> = ({ timetable, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRIMARY':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'INACTIVE':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 hover:border-neutral-600 transition-all duration-200 cursor-pointer hover:shadow-lg"
      onClick={() => onClick?.(timetable._id)}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white truncate flex-1 mr-4">
          {timetable.title}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(timetable.status)}`}>
          {timetable.status}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm text-neutral-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Valid until: {formatDate(timetable.lifetime)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 text-neutral-500">
          <CheckCircle className="w-4 h-4" />
          <span className="text-xs">ID: {timetable._id.slice(-6)}</span>
        </div>
      </div>
    </div>
  );
};

export default TimetableCard;