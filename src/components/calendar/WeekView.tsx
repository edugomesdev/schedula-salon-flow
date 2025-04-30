
import React, { useMemo } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { CalendarViewProps } from '@/types/calendar';
import { useCalendar } from '@/contexts/CalendarContext';
import { getDaysOfWeek, generateTimeSlots, formatTime } from '@/utils/calendarUtils';
import EntryDragItem from './dnd/EntryDragItem';
import TimeSlotDropZone from './dnd/TimeSlotDropZone';

const WeekView = ({ stylists, entries, onSlotClick, onEntryClick, onEntryDrop }: CalendarViewProps) => {
  const { selectedDate, stylistVisibility } = useCalendar();
  
  // Get all days of the current week
  const daysOfWeek = useMemo(() => getDaysOfWeek(selectedDate), [selectedDate]);
  
  // Generate time slots (hours)
  const timeSlots = useMemo(() => generateTimeSlots(selectedDate, 8, 20, 60), [selectedDate]);
  
  // Filter entries for visible stylists
  const visibleEntries = useMemo(() => {
    return entries.filter(entry => stylistVisibility[entry.stylist_id] !== false);
  }, [entries, stylistVisibility]);

  // Enhanced slot click handler with debugging
  const handleSlotClick = (day: Date, slot: any, e: React.MouseEvent) => {
    console.log(`[WeekView] Slot clicked for day ${format(day, 'yyyy-MM-dd')} and time ${slot.hour}:${slot.minute}`, {
      target: e.target,
      currentTarget: e.currentTarget
    });
    e.stopPropagation();
    
    const dateTime = new Date(day);
    dateTime.setHours(slot.hour, slot.minute);
    onSlotClick(dateTime);
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="grid grid-cols-[100px_repeat(7,1fr)] divide-x">
        {/* Empty top-left cell */}
        <div className="bg-gray-50 border-b h-16 flex items-center justify-center font-medium">
          Time
        </div>
        
        {/* Days header */}
        {daysOfWeek.map((day, idx) => (
          <div 
            key={idx} 
            className={`h-16 border-b flex flex-col items-center justify-center ${
              isSameDay(day, new Date()) ? 'bg-blue-50' : ''
            }`}
          >
            <div className="text-sm font-medium">{format(day, 'EEE')}</div>
            <div className="text-lg font-bold">{format(day, 'd')}</div>
          </div>
        ))}
        
        {/* Time slots and events */}
        {timeSlots.map((slot, slotIdx) => (
          <React.Fragment key={slotIdx}>
            {/* Time label */}
            <div className="bg-gray-50 border-b h-24 flex items-center justify-center text-sm text-gray-500">
              {formatTime(slot.time)}
            </div>
            
            {/* Days cells */}
            {daysOfWeek.map((day, dayIdx) => {
              // Find entries for this day and time slot
              const dayEntries = visibleEntries.filter(entry => {
                const entryDate = parseISO(entry.start_time);
                return isSameDay(entryDate, day) && 
                       entryDate.getHours() === slot.hour && 
                       entryDate.getMinutes() === slot.minute;
              });
              
              const isBooked = dayEntries.length > 0;
              const dateTime = new Date(day);
              dateTime.setHours(slot.hour, slot.minute);
              
              return (
                <div 
                  key={dayIdx}
                  className={`border-b h-24 relative ${
                    isSameDay(day, new Date()) ? 'bg-blue-50' : ''
                  }`}
                >
                  <TimeSlotDropZone
                    time={dateTime}
                    onDrop={onEntryDrop}
                    onSlotClick={onSlotClick}
                  >
                    {/* Empty slot clickable area with higher z-index */}
                    <div 
                      className="absolute inset-0 cursor-pointer hover:bg-gray-50 flex items-center justify-center text-sm text-gray-400 z-30"
                      onClick={(e) => handleSlotClick(day, slot, e)}
                      data-testid="calendar-week-slot"
                    >
                      {!isBooked && (
                        <span className="opacity-0 hover:opacity-100 transition-opacity duration-200">+</span>
                      )}
                    </div>
                    
                    {/* Appointments */}
                    <div className="absolute inset-0 p-1 flex flex-col gap-1 z-20">
                      {dayEntries.map(entry => {
                        const stylist = stylists.find(s => s.id === entry.stylist_id);
                        const bgColor = stylist?.color || '#CBD5E0';
                        
                        return (
                          <EntryDragItem 
                            key={entry.id} 
                            entry={entry}
                            stylist={stylist}
                            onEntryClick={onEntryClick}
                          >
                            <div 
                              className="p-1 rounded-md text-xs overflow-hidden cursor-pointer flex-1"
                              style={{ backgroundColor: bgColor }}
                            >
                              <div className="font-medium truncate">{entry.title}</div>
                              {entry.client_name && (
                                <div className="text-xs opacity-90 truncate">{entry.client_name}</div>
                              )}
                            </div>
                          </EntryDragItem>
                        );
                      })}
                    </div>
                  </TimeSlotDropZone>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
