
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay, isSameDay } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';
import { isEventInDate, generateEventKey } from '@/utils/calendar';

interface CalendarGridProps {
  title: string;
  color: string;
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect?: (date: Date) => void;
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

export const CalendarGrid = ({ title, color, selectedDate, events, onEventClick, onDateSelect }: CalendarGridProps) => {
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
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const dayEvents = events.filter(event => isEventInDate(event, day));
          const dayFormatted = format(day, 'yyyy-MM-dd');
          
          return (
            <div 
              key={`day-${dayFormatted}`}
              onClick={() => onDateSelect && onDateSelect(day)}
              className={`border-t border-l h-16 p-1 cursor-pointer
                ${!isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''}
                ${isToday ? 'bg-blue-50' : ''}
              `}
            >
              <div className="text-right text-xs">
                {format(day, 'd')}
              </div>
              <div className="overflow-y-auto h-10">
                {dayEvents.slice(0, 2).map((event) => (
                  <div 
                    key={generateEventKey(event, day)}
                    className={`text-xs p-0.5 mb-0.5 rounded truncate cursor-pointer
                      ${event.status === 'booked' ? color || 'bg-primary text-primary-foreground' : 'bg-gray-100'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    {event.startTime.substring(0, 5)} {event.title || event.clientName}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-primary font-medium">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
