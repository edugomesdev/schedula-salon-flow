
import { CalendarNavigation } from './CalendarNavigation';
import { CalendarViewSelector } from './CalendarViewSelector';
import { StaffSelector } from './StaffSelector';
import { Button } from '@/components/ui/button';
import { CalendarViewType } from '@/types/calendar';

interface CalendarToolbarProps {
  date: Date;
  viewType: CalendarViewType;
  selectedStaffIds: string[];
  showSideBySide: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (viewType: CalendarViewType) => void;
  onStaffSelectionChange: (staffIds: string[]) => void;
  onToggleSideBySide: () => void;
}

export const CalendarToolbar = ({
  date,
  viewType,
  selectedStaffIds,
  showSideBySide,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
  onStaffSelectionChange,
  onToggleSideBySide
}: CalendarToolbarProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
      <CalendarNavigation 
        date={date}
        viewType={viewType}
        onPrevious={onPrevious}
        onNext={onNext}
        onToday={onToday}
      />
      
      <div className="flex gap-2 items-center">
        {selectedStaffIds.length > 1 && viewType === 'month' && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onToggleSideBySide}
          >
            {showSideBySide ? 'Combined View' : 'Side by Side'}
          </Button>
        )}
        <CalendarViewSelector 
          viewType={viewType} 
          onViewChange={onViewChange} 
        />
        <StaffSelector 
          selectedStaffIds={selectedStaffIds}
          onSelectionChange={onStaffSelectionChange}
        />
      </div>
    </div>
  );
};
