
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { MultiCalendarView } from './MultiCalendarView';
import { CalendarEvent, CalendarViewType } from '@/types/calendar';

interface StaffEventsGroup {
  staffId: string;
  staffName: string;
  events: CalendarEvent[];
}

interface CalendarMainViewProps {
  viewType: CalendarViewType;
  selectedDate: Date;
  events: CalendarEvent[];
  staffEventsGroups: StaffEventsGroup[];
  showSideBySide: boolean;
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect: (date: Date) => void;
  onDateChange: (date: Date) => void;
}

export const CalendarMainView = ({
  viewType,
  selectedDate,
  events,
  staffEventsGroups,
  showSideBySide,
  onEventClick,
  onDateSelect,
  onDateChange
}: CalendarMainViewProps) => {
  // Show empty state if there are no events
  if (events.length === 0 && staffEventsGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-300px)] border rounded-md bg-gray-50">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No calendar entries available</p>
          <p className="text-sm text-muted-foreground">All calendar data has been cleared</p>
        </div>
      </div>
    );
  }
  
  if (showSideBySide && viewType === 'month' && staffEventsGroups.length > 1) {
    return (
      <MultiCalendarView 
        selectedDate={selectedDate}
        staffEvents={staffEventsGroups}
        onEventClick={onEventClick}
        onDateChange={onDateChange}
      />
    );
  }
  
  const commonProps = {
    selectedDate,
    events,
    onEventClick,
    onDateSelect,
  };
  
  switch (viewType) {
    case 'day':
      return <DayView {...commonProps} />;
    case 'week':
      return <WeekView {...commonProps} />;
    case 'month':
      return <MonthView {...commonProps} />;
    default:
      return <WeekView {...commonProps} />;
  }
};
