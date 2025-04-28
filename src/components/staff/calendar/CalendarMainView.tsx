
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
