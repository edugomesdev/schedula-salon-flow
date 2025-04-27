
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import type { DayContentProps } from "react-day-picker";

interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked';
}

interface CalendarViewProps {
  selectedDate: Date | undefined;
  timeSlots: TimeSlot[];
  onSelect: (date: Date | undefined) => void;
}

export const CalendarView = ({ selectedDate, timeSlots, onSelect }: CalendarViewProps) => {
  const getDayBadge = (day: Date) => {
    const dayTimeSlots = timeSlots.filter(
      slot => slot.date === format(day, 'yyyy-MM-dd')
    );
    
    if (dayTimeSlots.length > 0) {
      return <Badge variant="outline" className="absolute bottom-0 right-0 h-2 w-2 bg-primary rounded-full" />;
    }
    return null;
  };

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onSelect}
      className="rounded-md"
      components={{
        DayContent: (props: DayContentProps) => (
          <div className="relative w-full h-full flex items-center justify-center">
            {format(props.date, 'd')}
            {getDayBadge(props.date)}
          </div>
        ),
      }}
    />
  );
};

