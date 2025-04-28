
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
}

const CalendarContent = ({ 
  stylists, 
  entries, 
  onSlotClick, 
  onEntryClick 
}: CalendarContentProps) => {
  const { view } = useCalendar();

  // Handle slot click with console log for debugging
  const handleSlotClick = (time: Date, stylistId?: string) => {
    console.log('CalendarContent: slot clicked', { time, stylistId });
    onSlotClick(time, stylistId);
  };

  // Handle entry click with console log for debugging
  const handleEntryClick = (entry: CalendarEntry) => {
    console.log('CalendarContent: entry clicked', entry);
    onEntryClick(entry);
  };

  return (
    <div className="overflow-x-auto">
      {view === 'day' && (
        <DayView 
          stylists={stylists} 
          entries={entries} 
          onSlotClick={handleSlotClick} 
          onEntryClick={handleEntryClick} 
        />
      )}
      
      {view === 'week' && (
        <WeekView 
          stylists={stylists} 
          entries={entries} 
          onSlotClick={handleSlotClick} 
          onEntryClick={handleEntryClick} 
        />
      )}
      
      {view === 'month' && (
        <MonthView 
          stylists={stylists} 
          entries={entries} 
          onSlotClick={handleSlotClick} 
          onEntryClick={handleEntryClick} 
        />
      )}
    </div>
  );
};

export default CalendarContent;
