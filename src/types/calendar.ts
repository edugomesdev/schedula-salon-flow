
export interface TimeSlot {
  id: string;
  stylistId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked';
  clientName?: string;
  serviceName?: string;
}

export interface StaffCalendarProps {
  staffId: string;
}

export type CalendarViewType = 'day' | 'week' | 'month';

export interface AggregatedCalendarProps {
  staffIds: string[];
}

export interface CalendarEvent {
  id: string;
  stylistId: string;
  stylistName?: string;
  date: string;
  startTime: string;
  endTime: string;
  title?: string;
  clientName?: string;
  serviceName?: string;
  status: 'available' | 'booked';
  color?: string;
}

export interface CalendarViewProps {
  viewType: CalendarViewType;
  selectedDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export interface MultiCalendarProps {
  selectedDate: Date;
  staffIds: string[];
  onEventClick: (event: CalendarEvent) => void;
}

export interface StaffCalendarEvent extends CalendarEvent {
  staffName: string;
  color: string;
}

export interface CalendarEntryFormProps {
  stylistId: string;
  selectedDate: Date;
  startTime?: string;
  endTime?: string;
  clientName?: string;
  serviceName?: string;
  onSuccess: () => void;
  onCancel: () => void;
}
