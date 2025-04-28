
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

  return (
    <div className="overflow-x-auto">
      {view === 'day' && (
        <DayView 
          stylists={stylists} 
          entries={entries} 
          onSlotClick={onSlotClick} 
          onEntryClick={onEntryClick} 
        />
      )}
      
      {view === 'week' && (
        <WeekView 
          stylists={stylists} 
          entries={entries} 
          onSlotClick={onSlotClick} 
          onEntryClick={onEntryClick} 
        />
      )}
      
      {view === 'month' && (
        <MonthView 
          stylists={stylists} 
          entries={entries} 
          onSlotClick={onSlotClick} 
          onEntryClick={onEntryClick} 
        />
      )}
    </div>
  );
};

export default CalendarContent;
