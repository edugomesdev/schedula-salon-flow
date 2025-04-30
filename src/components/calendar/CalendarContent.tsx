
import { useState } from 'react';
import { useCalendar } from '@/contexts/CalendarContext';
import { CalendarEntry, Stylist } from '@/types/calendar';

import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';

interface CalendarContentProps {
  stylists: Stylist[];
  entries: CalendarEntry[];
  onSlotClick: (time: Date, stylistId?: string) => void;
  onEntryClick: (entry: CalendarEntry) => void;
  onEntryDrop: (entryId: string, newTime: Date, newStylistId?: string) => void;
}

const CalendarContent = ({ 
  stylists, 
  entries, 
  onSlotClick, 
  onEntryClick,
  onEntryDrop 
}: CalendarContentProps) => {
  const { view } = useCalendar();
  const [clickDebug, setClickDebug] = useState<{time: string, count: number}>({time: '', count: 0});

  // Enhanced slot click handler with debugging
  const handleSlotClick = (time: Date, stylistId?: string) => {
    const timeStr = time.toISOString();
    console.log(`[CalendarContent] Slot clicked at ${timeStr}`, { stylistId, view });
    
    // Visual debugging - increment counter for same time clicks
    setClickDebug(prev => ({
      time: timeStr,
      count: prev.time === timeStr ? prev.count + 1 : 1
    }));
    
    // Call the parent handler
    onSlotClick(time, stylistId);
  };

  // Enhanced entry click handler with debugging
  const handleEntryClick = (entry: CalendarEntry) => {
    console.log(`[CalendarContent] Entry clicked: ${entry.id}`, entry);
    onEntryClick(entry);
  };

  // Handle drag and drop
  const handleEntryDrop = (entryId: string, newTime: Date, newStylistId?: string) => {
    console.log(`[CalendarContent] Entry dropped: ${entryId} at ${newTime.toISOString()}`, { newStylistId });
    onEntryDrop(entryId, newTime, newStylistId);
  };

  return (
    <div className="overflow-x-auto">
      {/* Debug info - only visible during development */}
      {process.env.NODE_ENV !== 'production' && clickDebug.count > 0 && (
        <div className="bg-yellow-100 p-2 mb-2 text-xs">
          Last click: {clickDebug.time} (clicked {clickDebug.count} times)
        </div>
      )}
      
      {view === 'day' && (
        <DayView 
          stylists={stylists} 
          entries={entries} 
          onSlotClick={handleSlotClick} 
          onEntryClick={handleEntryClick}
          onEntryDrop={handleEntryDrop}
        />
      )}
      
      {view === 'week' && (
        <WeekView 
          stylists={stylists} 
          entries={entries} 
          onSlotClick={handleSlotClick} 
          onEntryClick={handleEntryClick}
          onEntryDrop={handleEntryDrop}
        />
      )}
      
      {view === 'month' && (
        <MonthView 
          stylists={stylists} 
          entries={entries} 
          onSlotClick={handleSlotClick} 
          onEntryClick={handleEntryClick}
          onEntryDrop={handleEntryDrop}
        />
      )}
    </div>
  );
};

export default CalendarContent;
