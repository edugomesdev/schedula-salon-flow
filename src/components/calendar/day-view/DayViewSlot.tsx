
import { useState } from 'react';
import { CalendarEntry, Stylist, TimeSlot } from '@/types/calendar';
import { useCalendar } from '@/contexts/CalendarContext';
import EntryDragItem from '../dnd/EntryDragItem';
import TimeSlotDropZone from '../dnd/TimeSlotDropZone';

interface DayViewSlotProps {
  slot: TimeSlot;
  stylists: Stylist[];
  entriesByStyle: Record<string, CalendarEntry[]>;
  onSlotClick: (time: Date) => void;
  onEntryClick: (entry: CalendarEntry) => void;
  onEntryDrop: (entryId: string, newTime: Date, stylistId?: string) => void;
}

const DayViewSlot = ({ 
  slot, 
  stylists, 
  entriesByStyle, 
  onSlotClick, 
  onEntryClick,
  onEntryDrop
}: DayViewSlotProps) => {
  const { stylistVisibility } = useCalendar();
  const [wasClicked, setWasClicked] = useState(false);
  
  // Enhanced click handler with improved debugging and visualization
  const handleSlotClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent parent elements from capturing the click
    e.stopPropagation();
    
    console.log(`[DayViewSlot] Slot clicked at ${slot.time.toISOString()}`, { 
      target: e.target, 
      currentTarget: e.currentTarget,
      slotHour: slot.hour,
      slotMinute: slot.minute
    });
    
    // Visual feedback
    setWasClicked(true);
    setTimeout(() => setWasClicked(false), 500);
    
    // Call the parent handler with the slot time
    onSlotClick(slot.time);
  };
  
  return (
    <div className="grid grid-cols-1 h-24 border-b relative">
      <TimeSlotDropZone 
        time={slot.time}
        onDrop={onEntryDrop}
        onSlotClick={onSlotClick}
      >
        {/* Empty slot with improved clickability */}
        <div
          className={`absolute inset-0 cursor-pointer hover:bg-gray-50 flex items-center justify-center text-sm text-gray-400 z-10 
            ${wasClicked ? 'bg-blue-100' : ''}`}
          onClick={handleSlotClick}
          data-testid="calendar-slot"
          aria-label={`Create appointment at ${slot.hour}:${slot.minute < 10 ? '0' : ''}${slot.minute}`}
        >
          {!slot.isBooked && (
            <span className="opacity-0 hover:opacity-100 transition-opacity duration-200">+ Create Appointment</span>
          )}
        </div>
        
        {/* Appointments with higher z-index to allow clicking them */}
        <div className="absolute inset-0 p-1 z-20 pointer-events-none">
          {stylists.map(stylist => {
            if (stylistVisibility[stylist.id] === false) return null;
            
            const stylistEntries = entriesByStyle[stylist.id] || [];
            const currentEntries = stylistEntries.filter(entry => {
              const startTime = new Date(entry.start_time);
              return startTime.getHours() === slot.hour && startTime.getMinutes() === slot.minute;
            });
            
            return currentEntries.map((entry) => (
              <EntryDragItem 
                key={entry.id} 
                entry={entry} 
                stylist={stylist}
                onEntryClick={onEntryClick}
              >
                <div
                  className="p-2 rounded-md text-xs h-full overflow-hidden cursor-pointer pointer-events-auto"
                  style={{ backgroundColor: stylist.color || '#CBD5E0' }}
                >
                  <div className="font-medium">{entry.title}</div>
                  {entry.client_name && (
                    <div className="text-xs opacity-90">{entry.client_name}</div>
                  )}
                  {entry.service_name && (
                    <div className="text-xs opacity-75">{entry.service_name}</div>
                  )}
                </div>
              </EntryDragItem>
            ));
          })}
        </div>
      </TimeSlotDropZone>
    </div>
  );
};

export default DayViewSlot;
