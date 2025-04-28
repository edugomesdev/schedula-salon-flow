
import { format, parseISO } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';
import { getDayViewHours } from '@/utils/calendar';

interface DayViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export const DayView = ({ selectedDate, events, onEventClick }: DayViewProps) => {
  const hours = getDayViewHours();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  // Filter events for the selected day
  const dayEvents = events.filter(event => event.date === dateStr);
  
  return (
    <div className="h-[calc(100vh-300px)] overflow-y-auto">
      <div className="min-w-full border border-gray-200 rounded-md">
        <div className="text-center font-semibold py-4 border-b">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </div>
        <div className="grid grid-cols-[80px_1fr] divide-x">
          {/* Time slots */}
          <div className="divide-y">
            {hours.map(hour => (
              <div key={hour} className="h-16 px-2 py-1 text-xs text-gray-500">
                {hour}
              </div>
            ))}
          </div>
          
          {/* Events */}
          <div className="relative divide-y">
            {hours.map(hour => {
              const hourValue = parseInt(hour.split(':')[0]);
              const hourEvents = dayEvents.filter(event => {
                const startHour = parseInt(event.startTime.split(':')[0]);
                return startHour === hourValue;
              });
              
              return (
                <div key={hour} className="h-16 relative">
                  {hourEvents.map((event, index) => (
                    <div 
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`absolute left-0 right-0 mx-1 px-2 py-1 rounded text-xs cursor-pointer truncate
                        ${event.status === 'booked' ? event.color || 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-700'}`}
                      style={{
                        top: `${index * 24}%`,
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
          </div>
        </div>
      </div>
    </div>
  );
};
