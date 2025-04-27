
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface TimeSlot {
  id: string;
  stylistId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked';
}

interface TimeSlotListProps {
  selectedDate: Date | undefined;
  timeSlots: TimeSlot[];
  loading: boolean;
  onSlotClick: (startTime: string, endTime: string) => void;
}

export const TimeSlotList = ({ selectedDate, timeSlots, loading, onSlotClick }: TimeSlotListProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p>Loading time slots...</p>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground">Select a date to view available time slots</p>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground">No time slots available for this date</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {timeSlots.map((slot) => (
        <button
          key={slot.id}
          onClick={() => onSlotClick(slot.startTime, slot.endTime)}
          disabled={slot.status === 'booked'}
          className="w-full p-3 border rounded-md hover:bg-secondary/20 cursor-pointer flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-sm">{slot.startTime} - {slot.endTime}</span>
          <Badge variant={slot.status === 'available' ? 'outline' : 'destructive'}>
            {slot.status === 'available' ? 'Available' : 'Booked'}
          </Badge>
        </button>
      ))}
    </div>
  );
};
