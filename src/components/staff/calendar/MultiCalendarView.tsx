
import { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarEvent } from '@/types/calendar';
import { CalendarGrid } from './CalendarGrid';
import { CALENDAR_COLORS } from '@/utils/colorConstants';

interface MultiCalendarViewProps {
  selectedDate: Date;
  staffEvents: {
    staffId: string;
    staffName: string;
    events: CalendarEvent[];
    color?: string;
  }[];
  onEventClick: (event: CalendarEvent) => void;
  onDateChange: (date: Date) => void;
}

export const MultiCalendarView = ({ 
  selectedDate, 
  staffEvents, 
  onEventClick, 
  onDateChange 
}: MultiCalendarViewProps) => {
  const navigatePrevious = () => {
    onDateChange(subMonths(selectedDate, 1));
  };
  
  const navigateNext = () => {
    onDateChange(addMonths(selectedDate, 1));
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-center items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={navigatePrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-semibold">
          {format(selectedDate, 'MMMM yyyy')}
        </h2>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={navigateNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex gap-1 overflow-x-auto h-[calc(100vh-300px)]">
        {staffEvents.map((staff, index) => (
          <CalendarGrid
            key={staff.staffId}
            title={staff.staffName}
            color={staff.color || CALENDAR_COLORS[index % CALENDAR_COLORS.length]}
            selectedDate={selectedDate}
            events={staff.events}
            onEventClick={onEventClick}
            onDateSelect={(date) => onDateChange(date)}
          />
        ))}
      </div>
    </div>
  );
};
