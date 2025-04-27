
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarView } from './calendar/CalendarView';
import { TimeSlotList } from './calendar/TimeSlotList';

interface TimeSlot {
  id: string;
  stylistId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked';
}

interface StaffCalendarProps {
  staffId: string;
}

const StaffCalendar = ({ staffId }: StaffCalendarProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const { toast } = useToast();
  
  const fetchTimeSlots = async (date: Date) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .eq('stylist_id', staffId)
        .gte('day_of_week', 0)
        .lte('day_of_week', 6);
      
      if (error) throw error;
      
      const monthDays = eachDayOfInterval({
        start: startOfMonth(date),
        end: endOfMonth(date)
      });
      
      const generatedTimeSlots: TimeSlot[] = [];
      monthDays.forEach(day => {
        const dayOfWeek = day.getDay();
        const workingHoursForDay = data?.filter(
          hours => hours.day_of_week === dayOfWeek && !hours.is_day_off
        );
        
        workingHoursForDay?.forEach(hours => {
          generatedTimeSlots.push({
            id: `${staffId}-${format(day, 'yyyy-MM-dd')}-${hours.start_time}`,
            stylistId: staffId,
            date: format(day, 'yyyy-MM-dd'),
            startTime: hours.start_time,
            endTime: hours.end_time,
            status: 'available'
          });
        });
      });
      
      setTimeSlots(generatedTimeSlots);
      
      if (selectedDate) {
        const slotsForSelectedDate = generatedTimeSlots.filter(
          slot => slot.date === format(selectedDate, 'yyyy-MM-dd')
        );
        setSelectedTimeSlots(slotsForSelectedDate);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch time slots. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTimeSlots(date);
  }, [date, staffId]);
  
  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;
    
    setSelectedDate(newDate);
    const slotsForDay = timeSlots.filter(
      slot => slot.date === format(newDate, 'yyyy-MM-dd')
    );
    setSelectedTimeSlots(slotsForDay);
  };
  
  const handlePreviousMonth = () => {
    const newDate = subMonths(date, 1);
    setDate(newDate);
  };
  
  const handleNextMonth = () => {
    const newDate = addMonths(date, 1);
    setDate(newDate);
  };

  return (
    <div className="space-y-6">
      <CalendarHeader 
        date={date}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
      />
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2 border rounded-md p-4">
          <CalendarView
            selectedDate={selectedDate}
            timeSlots={timeSlots}
            onSelect={handleDateSelect}
          />
        </div>
        
        <div className="md:w-1/2 border rounded-md p-4">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
          </h3>
          
          <TimeSlotList
            selectedDate={selectedDate}
            timeSlots={selectedTimeSlots}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default StaffCalendar;

