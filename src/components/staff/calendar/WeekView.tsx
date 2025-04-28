
import { format } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';
import { getDayViewHours, getWeekDays, isEventInDate } from '@/utils/calendar';

interface WeekViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect: (date: Date) => void;
}

export const WeekView = ({ 
  selectedDate, 
  events, 
  onEventClick, 
  onDateSelect 
}: WeekViewProps) => {
  const hours = getDayViewHours();
  const weekDays = getWeekDays(selectedDate);
  
  return (
    <div className="h-[calc(100vh-300px)] overflow-auto">
      <div className="min-w-full border border-gray-200 rounded-md">
        {/* Header */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] divide-x border-b">
          <div className="p-2"></div>
          {weekDays.map(day => (
            <div 
              key={day.toISOString()} 
              className="p-2 text-center cursor-pointer hover:bg-gray-50"
              onClick={() => onDateSelect(day)}
            >
              <div className="font-medium">{format(day, 'EEE')}</div>
              <div className={`text-sm rounded-full w-7 h-7 flex items-center justify-center mx-auto
                ${format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? 
                  'bg-primary text-primary-foreground' : ''}`}
              >
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        {/* Time grid */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] divide-x">
          {/* Time slots */}
          <div className="divide-y">
            {hours.map(hour => (
              <div key={hour} className="h-16 px-2 py-1 text-xs text-gray-500">
                {hour}
              </div>
            ))}
          </div>
          
          {/* Days */}
          {weekDays.map(day => (
            <div key={day.toISOString()} className="divide-y">
              {hours.map(hour => {
                const hourValue = parseInt(hour.split(':')[0]);
                const dayEvents = events.filter(event => {
                  const startHour = parseInt(event.startTime.split(':')[0]);
                  return isEventInDate(event, day) && startHour === hourValue;
                });
                
                return (
                  <div key={hour} className="h-16 relative">
                    {dayEvents.map((event, index) => (
                      <div 
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`absolute left-0 right-0 mx-1 px-1 py-0.5 rounded text-xs cursor-pointer truncate
                          ${event.status === 'booked' ? event.color || 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-700'}`}
                        style={{
                          top: `${index * 24}%`,
                          height: '80%',
                          zIndex: event.status === 'booked' ? 10 : 5
                        }}
                      >
                        <div className="font-semibold truncate">
                          {event.startTime}
                        </div>
                        <div className="truncate">
                          {event.title}
                        </div>
                        {event.stylistName && (
                          <div className="text-xs opacity-80 truncate">
                            {event.stylistName}
                          </div>
                        )}
                      </div>
                    ))}
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
