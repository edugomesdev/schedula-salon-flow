
import { format } from 'date-fns';
import type { TimeSlot } from '@/types/calendar';

export const generateTimeSlots = (day: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 9; hour < 17; hour++) {
    slots.push({
      id: `default-${format(day, 'yyyy-MM-dd')}-${hour}`,
      stylistId: '',
      date: format(day, 'yyyy-MM-dd'),
      startTime: `${hour}:00`,
      endTime: `${hour + 1}:00`,
      status: 'available'
    });
  }
  return slots;
};
