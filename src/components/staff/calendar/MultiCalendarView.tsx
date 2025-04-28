
import { useState } from 'react';
import { format, addDays, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarEvent } from '@/types/calendar';
import { isEventInDate } from '@/utils/calendar';

interface CalendarGridProps {
  title: string;
  color: string;
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const generateCalendarDays = (currentDate: Date) => {
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  
  // Get all days in the month
  let days = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth
  });
  
  // Calculate the first day of the week (0 is Sunday)
  const firstDayOfWeek = getDay(firstDayOfMonth);
  
  // Prepend days from previous month to align with the week
  for (let i = 0; i < firstDayOfWeek; i++) {
    days = [addDays(firstDayOfMonth, -1 * (i + 1)), ...days];
  }
  
  // Append days from next month to complete the calendar grid
  const daysToAdd = 42 - days.length; // 6 rows of 7 days
  for (let i = 1; i <= daysToAdd; i++) {
    days.push(addDays(lastDayOfMonth, i));
  }
  
  return days;
};

const CalendarGrid = ({ title, color, selectedDate, events, onEventClick }: CalendarGridProps) => {
  const days = generateCalendarDays(selectedDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="flex-1 border border-gray-200 rounded-md overflow-hidden">
      <div className={`text-center font-semibold py-2 text-white ${color}`}>
        {title}
      </div>
      
      {/* Week days header */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs py-1 font-medium">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 grid-rows-6 h-full">
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const dayEvents = events.filter(event => isEventInDate(event, day));
          
          return (
            <div 
              key={i} 
              className={`border-t border-l h-16 p-1 ${!isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''}`}
            >
              <div className="text-right text-xs">
                {format(day, 'd')}
              </div>
              <div className="overflow-y-auto h-10">
                {dayEvents.slice(0, 2).map((event, j) => (
                  <div 
                    key={`${event.id}-${j}`}
                    className={`text-xs p-0.5 mb-0.5 rounded truncate cursor-pointer
                      ${event.status === 'booked' ? 'bg-primary text-primary-foreground' : 'bg-gray-100'}`}
                    onClick={() => onEventClick(event)}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-primary font-medium">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

interface MultiCalendarViewProps {
  selectedDate: Date;
  staffEvents: {
    staffId: string;
    staffName: string;
    events: CalendarEvent[];
    color?: string;
  }[];
  onEventClick: (event: CalendarEvent) => void;
  onDateChange: (date: Date) => void;
}

const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-teal-500',
];

export const MultiCalendarView = ({ 
  selectedDate, 
  staffEvents, 
  onEventClick, 
  onDateChange 
}: MultiCalendarViewProps) => {
  const navigatePrevious = () => {
    onDateChange(subMonths(selectedDate, 1));
  };
  
  const navigateNext = () => {
    onDateChange(addMonths(selectedDate, 1));
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-center items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={navigatePrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-semibold">
          {format(selectedDate, 'MMMM yyyy')}
        </h2>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={navigateNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex gap-1 overflow-x-auto h-[calc(100vh-300px)]">
        {staffEvents.map((staff, index) => (
          <CalendarGrid
            key={staff.staffId}
            title={staff.staffName}
            color={staff.color || COLORS[index % COLORS.length]}
            selectedDate={selectedDate}
            events={staff.events}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
};
