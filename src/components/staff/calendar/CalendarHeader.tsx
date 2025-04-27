
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';

interface CalendarHeaderProps {
  date: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onAddEntry: () => void;
}

export const CalendarHeader = ({ 
  date, 
  onPreviousMonth, 
  onNextMonth,
  onAddEntry 
}: CalendarHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Staff Calendar</h2>
        <Button onClick={onAddEntry} variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-4 w-4" />
          <span>{format(date, 'MMMM yyyy')}</span>
        </div>
        <Button variant="outline" onClick={onNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
