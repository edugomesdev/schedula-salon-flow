
import { useState, useMemo } from 'react';
import { format, isSameHour, isSameMinute, parseISO } from 'date-fns';
import { CalendarViewProps, TimeSlot } from '@/types/calendar';
import { useCalendar } from '@/contexts/CalendarContext';
import { generateTimeSlots, formatTime } from '@/utils/calendarUtils';

const DayView = ({ stylists, entries, onSlotClick, onEntryClick }: CalendarViewProps) => {
  const { selectedDate, stylistVisibility } = useCalendar();
  const [timeSlots] = useState<TimeSlot[]>(generateTimeSlots(selectedDate, 8, 20, 60));

  // Filter entries based on visible stylists
  const visibleEntries = useMemo(() => {
    return entries.filter(entry => {
      const isVisible = stylistVisibility[entry.stylist_id] !== false;
      return isVisible;
    });
  }, [entries, stylistVisibility]);

  // Find events for each time slot
  const slotsWithEntries = useMemo(() => {
    return timeSlots.map(slot => {
      const slotEntries = visibleEntries.filter(entry => {
        const startTime = parseISO(entry.start_time);
        return isSameHour(startTime, slot.time) && isSameMinute(startTime, slot.time);
      });

      return {
        ...slot,
        entries: slotEntries,
        isBooked: slotEntries.length > 0
      };
    });
  }, [timeSlots, visibleEntries]);

  // Group entries by stylist
  const entriesByStyle = useMemo(() => {
    const result: Record<string, typeof visibleEntries> = {};
    
    stylists.forEach(stylist => {
      if (stylistVisibility[stylist.id] !== false) {
        result[stylist.id] = visibleEntries.filter(entry => entry.stylist_id === stylist.id);
      }
    });
    
    return result;
  }, [stylists, visibleEntries, stylistVisibility]);

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="grid grid-cols-[100px_1fr] divide-x">
        {/* Time column */}
        <div className="bg-gray-50">
          <div className="h-16 border-b flex items-center justify-center font-medium">
            Time
          </div>
          {slotsWithEntries.map((slot, index) => (
            <div 
              key={index} 
              className="h-24 border-b flex items-center justify-center text-sm text-gray-500"
            >
              {formatTime(slot.time)}
            </div>
          ))}
        </div>
        
        {/* Calendar content */}
        <div className="flex-1">
          {/* Header with stylists */}
          <div className="grid grid-cols-1 h-16 border-b">
            <div className="flex items-center justify-center font-medium">
              {format(selectedDate, 'EEEE, MMMM d')}
            </div>
          </div>
          
          {/* Slots grid */}
          {slotsWithEntries.map((slot, index) => (
            <div key={index} className="grid grid-cols-1 h-24 border-b relative">
              {/* Empty slot */}
              <div
                className="absolute inset-0 cursor-pointer hover:bg-gray-50 flex items-center justify-center text-sm text-gray-400"
                onClick={() => onSlotClick(slot.time)}
              >
                {!slot.isBooked && (
                  <span className="opacity-0 hover:opacity-100">+ Create Appointment</span>
                )}
              </div>
              
              {/* Appointments */}
              <div className="absolute inset-0 p-1">
                {stylists.map(stylist => {
                  if (stylistVisibility[stylist.id] === false) return null;
                  
                  const stylistEntries = entriesByStyle[stylist.id] || [];
                  const currentEntries = stylistEntries.filter(entry => {
                    const startTime = parseISO(entry.start_time);
                    return isSameHour(startTime, slot.time) && isSameMinute(startTime, slot.time);
                  });
                  
                  return currentEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2 rounded-md text-xs h-full overflow-hidden cursor-pointer"
                      style={{ backgroundColor: stylist.color || '#CBD5E0' }}
                      onClick={() => onEntryClick(entry)}
                    >
                      <div className="font-medium">{entry.title}</div>
                      {entry.client_name && (
                        <div className="text-xs opacity-90">{entry.client_name}</div>
                      )}
                      {entry.service_name && (
                        <div className="text-xs opacity-75">{entry.service_name}</div>
                      )}
                    </div>
                  ));
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DayView;
