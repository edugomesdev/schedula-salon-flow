
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval, addDays, getHours, getMinutes, setHours, setMinutes, isSameDay } from 'date-fns';
import { CalendarEntry, DayEvents, Stylist, TimeSlot } from '@/types/calendar';

// Generate time slots for a day (typically from 8AM to 8PM)
export const generateTimeSlots = (
  date: Date, 
  startHour = 8, 
  endHour = 20, 
  interval = 60
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const day = startOfDay(date);
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const time = setMinutes(setHours(day, hour), minute);
      slots.push({
        time,
        hour,
        minute,
        entries: [],
        isBooked: false
      });
    }
  }
  
  return slots;
};

// Group calendar entries by day and hour
export const groupEntriesByDay = (entries: CalendarEntry[], date: Date): DayEvents => {
  const dayEvents: DayEvents = {};
  
  entries.forEach(entry => {
    const startTime = parseISO(entry.start_time);
    
    if (isSameDay(startTime, date)) {
      const hour = getHours(startTime);
      const minute = getMinutes(startTime);
      
      if (!dayEvents[hour]) {
        dayEvents[hour] = {};
      }
      
      if (!dayEvents[hour][minute]) {
        dayEvents[hour][minute] = [];
      }
      
      dayEvents[hour][minute].push(entry);
    }
  });
  
  return dayEvents;
};

// Get entries for a specific week
export const getWeekEntries = (entries: CalendarEntry[], date: Date) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday as first day
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  return entries.filter(entry => {
    const entryDate = parseISO(entry.start_time);
    return entryDate >= weekStart && entryDate <= weekEnd;
  });
};

// Get entries for a specific day
export const getDayEntries = (entries: CalendarEntry[], date: Date) => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  
  return entries.filter(entry => {
    const entryDate = parseISO(entry.start_time);
    return entryDate >= dayStart && entryDate <= dayEnd;
  });
};

// Generate days of the current week
export const getDaysOfWeek = (date: Date) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6)
  });
};

// Assign random colors to stylists that don't have a color
export const assignRandomColorsToStylists = (stylists: Stylist[]): Stylist[] => {
  const pastelColors = [
    '#FFB6C1', // Light Pink
    '#FFD700', // Gold
    '#98FB98', // Pale Green
    '#87CEFA', // Light Sky Blue
    '#DDA0DD', // Plum
    '#FFA07A', // Light Salmon
    '#20B2AA', // Light Sea Green
    '#F08080', // Light Coral
    '#9370DB', // Medium Purple
    '#FFDAB9'  // Peach Puff
  ];

  return stylists.map(stylist => {
    if (!stylist.color) {
      const randomColor = pastelColors[Math.floor(Math.random() * pastelColors.length)];
      return { ...stylist, color: randomColor };
    }
    return stylist;
  });
};

// Format time to display
export const formatTime = (date: Date): string => {
  return format(date, 'h:mm a');
};

// Format appointment time range to display
export const formatAppointmentTime = (start: string, end: string): string => {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
};

// Check if a time is outside working hours (e.g., before 9AM or after 6PM)
export const isOutsideWorkingHours = (time: Date): boolean => {
  const hour = getHours(time);
  return hour < 9 || hour >= 18;
};

// Check if two appointments overlap
export const doAppointmentsOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const s1 = parseISO(start1);
  const e1 = parseISO(end1);
  const s2 = parseISO(start2);
  const e2 = parseISO(end2);
  
  return s1 < e2 && s2 < e1;
};
