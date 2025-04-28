
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';
import { isEventInDate } from '@/utils/calendar';

interface MonthViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export const MonthView = ({ 
  selectedDate, 
  events, 
  onDateSelect,
  onEventClick 
}: MonthViewProps) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Create calendar grid with weeks
  const getCalendarDays = () => {
    const result = [];
    let week = [];
    
    // Add days before the 1st of the month to complete the week
    const firstDay = monthStart.getDay();
    for (let i = 0; i < firstDay; i++) {
      week.push(null);
    }
    
    // Add all days of the month
    for (let day of daysInMonth) {
      week.push(day);
      
      if (week.length === 7) {
        result.push([...week]);
        week = [];
      }
    }
    
    // Fill the last week with empty days if needed
    while (week.length > 0 && week.length < 7) {
      week.push(null);
      if (week.length === 7) {
        result.push([...week]);
      }
    }
    
    return result;
  };
  
  const calendarWeeks = getCalendarDays();
  
  const getDayEvents = (day: Date) => {
    if (!day) return [];
    return events.filter(event => isEventInDate(event, day));
  };
  
  return (
    <div className="h-[calc(100vh-300px)] overflow-auto">
      <div className="border border-gray-200 rounded-md bg-white">
        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center font-medium border-b">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="p-2">{day}</div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-1 divide-y">
          {calendarWeeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 divide-x">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <div key={`empty-${dayIndex}`} className="h-28 bg-gray-50"></div>;
                }
                
                const dayEvents = getDayEvents(day);
                const isCurrentMonth = isSameMonth(day, selectedDate);
                const isSelected = isSameDay(day, selectedDate);
                
                return (
                  <div 
                    key={day.toString()}
                    className={`h-28 p-1 overflow-hidden ${!isCurrentMonth ? 'bg-gray-50' : ''}`}
                    onClick={() => onDateSelect(day)}
                  >
                    {/* Day number */}
                    <div className={`text-right mb-1 ${isToday(day) ? 'font-bold text-blue-600' : ''}`}>
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full
                        ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    
                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div 
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                          className={`text-xs p-0.5 rounded truncate cursor-pointer
                            ${event.status === 'booked' ? event.color || 'bg-primary text-primary-foreground' : 'bg-gray-100'}`}
                        >
                          {event.startTime} - {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-blue-600 font-medium">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
