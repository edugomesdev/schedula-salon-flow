
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, addHours, parseISO, isSameDay } from 'date-fns';
import { CALENDAR_COLORS } from '@/utils/colorConstants';
import type { TimeSlot, CalendarEvent, CalendarViewType } from '@/types/calendar';

export const generateTimeSlots = (day: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const formattedDate = format(day, 'yyyy-MM-dd');
  
  for (let hour = 9; hour < 17; hour++) {
    slots.push({
      id: `slot-${formattedDate}-${hour}`,
      stylistId: '',
      date: formattedDate,
      startTime: `${hour}:00`,
      endTime: `${hour + 1}:00`,
      status: 'available'
    });
  }
  return slots;
};

export const getDayViewHours = (): string[] => {
  const hours = [];
  for (let i = 8; i <= 20; i++) {
    hours.push(i < 10 ? `0${i}:00` : `${i}:00`);
  }
  return hours;
};

export const getWeekDays = (selectedDate: Date): Date[] => {
  const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
  return eachDayOfInterval({
    start,
    end: endOfWeek(selectedDate, { weekStartsOn: 1 })
  });
};

export const formatTimeSlotEvent = (
  slot: TimeSlot, 
  stylistName?: string, 
  stylistIndex: number = 0
): CalendarEvent => {
  return {
    id: slot.id,
    stylistId: slot.stylistId,
    stylistName,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    title: slot.clientName ? `${slot.clientName} - ${slot.serviceName || ''}` : 'Available',
    clientName: slot.clientName,
    serviceName: slot.serviceName,
    status: slot.status,
    color: CALENDAR_COLORS[stylistIndex % CALENDAR_COLORS.length]
  };
};

export const getEventsForViewType = (
  events: CalendarEvent[],
  viewType: CalendarViewType,
  selectedDate: Date
): CalendarEvent[] => {
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  
  switch (viewType) {
    case 'day':
      return events.filter(event => event.date === formattedDate);
    case 'week': {
      const weekDays = getWeekDays(selectedDate).map(date => format(date, 'yyyy-MM-dd'));
      return events.filter(event => weekDays.includes(event.date));
    }
    case 'month':
      // For month view, we just return all events as filtering will be done by the calendar component
      return events;
    default:
      return events;
  }
};

export const isEventInDate = (event: CalendarEvent, date: Date): boolean => {
  const eventDate = parseISO(event.date);
  return isSameDay(eventDate, date);
};
