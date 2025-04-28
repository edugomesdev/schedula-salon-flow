
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
