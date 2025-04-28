
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay, isSameDay } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';
import { isEventInDate } from '@/utils/calendar';

interface MonthViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect: (date: Date) => void;
}

export const MonthView = ({ 
  selectedDate, 
  events, 
  onEventClick,
  onDateSelect 
}: MonthViewProps) => {
  const firstDayOfMonth = startOfMonth(selectedDate);
  const lastDayOfMonth = endOfMonth(selectedDate);
  
  // Get all days in the month
  let days = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth
  });
  
  // Calculate the first day of the week (0 is Sunday)
  const firstDayOfWeek = getDay(firstDayOfMonth);
  
  // Prepend days from previous month to align with the week
  for (let i = 0; i < firstDayOfWeek; i++) {
    days = [new Date(firstDayOfMonth.getTime() - ((i + 1) * 24 * 60 * 60 * 1000)), ...days];
  }
  
  // Append days from next month to complete the calendar grid
  const daysToAdd = 42 - days.length; // 6 rows of 7 days
  for (let i = 1; i <= daysToAdd; i++) {
    days.push(new Date(lastDayOfMonth.getTime() + (i * 24 * 60 * 60 * 1000)));
  }
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="border border-gray-200 rounded-md overflow-hidden h-[calc(100vh-300px)]">
      {/* Week days header */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div key={day} className="text-center py-2 font-medium">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 grid-rows-6 h-[calc(100%-40px)]">
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isSelected = isSameDay(day, selectedDate);
          const dayEvents = events.filter(event => isEventInDate(event, day));
          
          return (
            <div 
              key={i} 
              onClick={() => onDateSelect(day)}
              className={`border p-1 overflow-hidden ${
                !isCurrentMonth ? 'bg-gray-100 text-gray-400' : 
                isSelected ? 'bg-blue-50' : ''
              } cursor-pointer hover:bg-gray-50`}
            >
              <div className={`text-right ${
                isSelected ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center ml-auto' : ''
              }`}>
                {format(day, 'd')}
              </div>
              
              <div className="overflow-y-auto max-h-20">
                {dayEvents.map((event) => {
                  const eventColor = event.stylistName && events.filter(e => e.stylistId === event.stylistId).length > 0
                    ? event.color
                    : 'bg-primary text-primary-foreground';
                    
                  return (
                    <div 
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={`text-xs p-1 my-0.5 rounded truncate cursor-pointer
                        ${event.status === 'booked' ? eventColor || 'bg-primary text-primary-foreground' : 'bg-gray-100'}`}
                    >
                      {event.startTime.substring(0, 5)} {event.title}
                      {event.stylistName && <div className="text-xs truncate opacity-80">{event.stylistName}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
