
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarViewType } from '@/types/calendar';

interface CalendarNavigationProps {
  date: Date;
  viewType: CalendarViewType;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const CalendarNavigation = ({
  date,
  viewType,
  onPrevious,
  onNext,
  onToday
}: CalendarNavigationProps) => {
  const formatDateByViewType = () => {
    switch (viewType) {
      case 'day':
        return format(date, 'MMMM d, yyyy');
      case 'week':
        return `Week of ${format(date, 'MMMM d, yyyy')}`;
      case 'month':
        return format(date, 'MMMM yyyy');
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onPrevious}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onToday}
      >
        Today
      </Button>
      <h2 className="text-xl font-semibold">
        {formatDateByViewType()}
      </h2>
    </div>
  );
};
