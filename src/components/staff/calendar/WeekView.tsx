
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';
import { getWeekDays, generateEventKey } from '@/utils/calendar';

interface WeekViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect: (date: Date) => void;
}

export const WeekView = ({ selectedDate, events, onEventClick, onDateSelect }: WeekViewProps) => {
  const weekDays = getWeekDays(selectedDate);
  
  // Get hours from 8am to 8pm
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);
  
  return (
    <div className="h-[calc(100vh-300px)] overflow-y-auto">
      <div className="grid grid-cols-[80px_repeat(7,1fr)] border border-gray-200 rounded-md">
        {/* Header row with day names */}
        <div className="border-b p-2 text-center font-medium bg-gray-50"></div>
        {weekDays.map((day) => (
          <div 
            key={`header-${format(day, 'yyyy-MM-dd')}`}
            className="border-b border-l p-2 text-center font-medium bg-gray-50 cursor-pointer"
            onClick={() => onDateSelect(day)}
          >
            <div>{format(day, 'EEE')}</div>
            <div>{format(day, 'd')}</div>
          </div>
        ))}
        
        {/* Time slots and events */}
        {hours.map((hour) => (
          <>
            <div 
              key={`hour-${hour}`}
              className="border-b border-r py-2 px-1 text-xs text-right text-gray-500"
            >
              {hour}:00
            </div>
            
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const hourEvents = events.filter(event => {
                const eventDate = event.date;
                const eventHour = parseInt(event.startTime.split(':')[0]);
                return eventDate === dateStr && eventHour === hour;
              });
              
              return (
                <div 
                  key={`cell-${dateStr}-${hour}`}
                  className="border-b border-l min-h-16 relative"
                >
                  {hourEvents.map((event, index) => (
                    <div 
                      key={generateEventKey(event)}
                      onClick={() => onEventClick(event)}
                      className={`absolute inset-x-0.5 mx-0.5 px-1 py-0.5 rounded text-xs cursor-pointer truncate
                        ${event.status === 'booked' ? event.color || 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-700'}`}
                      style={{
                        top: `${index * 20}%`,
                        height: '80%',
                        zIndex: event.status === 'booked' ? 10 : 5
                      }}
                    >
                      <div className="font-semibold">
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="truncate">
                        {event.title}
                      </div>
                      {event.stylistName && (
                        <div className="text-xs font-light truncate">
                          {event.stylistName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
};
