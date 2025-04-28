
import { useState, useMemo } from 'react';
import { parseISO } from 'date-fns';
import { CalendarViewProps, TimeSlot } from '@/types/calendar';
import { useCalendar } from '@/contexts/CalendarContext';
import { generateTimeSlots } from '@/utils/calendarUtils';
import TimeColumn from './day-view/TimeColumn';
import DayViewGrid from './day-view/DayViewGrid';

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
        return startTime.getHours() === slot.hour && startTime.getMinutes() === slot.minute;
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
        <TimeColumn timeSlots={slotsWithEntries} />
        
        {/* Calendar content */}
        <DayViewGrid
          selectedDate={selectedDate}
          slotsWithEntries={slotsWithEntries}
          stylists={stylists}
          entriesByStyle={entriesByStyle}
          onSlotClick={onSlotClick}
          onEntryClick={onEntryClick}
        />
      </div>
    </div>
  );
};

export default DayView;
