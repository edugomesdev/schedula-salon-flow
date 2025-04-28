
import { Button } from '@/components/ui/button';
import { CalendarViewType } from '@/types/calendar';

interface CalendarViewSelectorProps {
  viewType: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

export const CalendarViewSelector = ({
  viewType,
  onViewChange
}: CalendarViewSelectorProps) => {
  return (
    <div className="flex space-x-1">
      <Button
        variant={viewType === 'day' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('day')}
      >
        Day
      </Button>
      <Button
        variant={viewType === 'week' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('week')}
      >
        Week
      </Button>
      <Button
        variant={viewType === 'month' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('month')}
      >
        Month
      </Button>
    </div>
  );
};
