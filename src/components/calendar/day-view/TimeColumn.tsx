
import { TimeSlot } from '@/types/calendar';
import { formatTime } from '@/utils/calendarUtils';

interface TimeColumnProps {
  timeSlots: TimeSlot[];
}

const TimeColumn = ({ timeSlots }: TimeColumnProps) => {
  return (
    <div className="bg-gray-50 border-r">
      <div className="h-16 border-b flex items-center justify-center font-medium">
        Time
      </div>
      {timeSlots.map((slot, index) => (
        <div 
          key={index} 
          className="h-24 border-b flex items-center justify-center text-sm text-gray-500"
        >
          {formatTime(slot.time)}
        </div>
      ))}
    </div>
  );
};

export default TimeColumn;
