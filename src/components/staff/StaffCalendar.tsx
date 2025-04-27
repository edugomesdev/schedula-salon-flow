
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { DayContentProps } from "react-day-picker";

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
      // Calculate the start and end of the month
      const start = format(startOfMonth(date), 'yyyy-MM-dd');
      const end = format(endOfMonth(date), 'yyyy-MM-dd');
      
      // Fetch time slots for the stylist in the selected month
      const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .eq('stylist_id', staffId)
        .gte('day_of_week', 0)
        .lte('day_of_week', 6);
      
      if (error) {
        throw error;
      }
      
      // Convert the working hours to time slots for the current month
      const monthDays = eachDayOfInterval({
        start: startOfMonth(date),
        end: endOfMonth(date)
      });
      
      // Generate time slots based on working hours
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
      
      // If a date is selected, update the selected time slots as well
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
  
  // Fetch time slots when the component mounts or when the month changes
  useState(() => {
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
  
  // Function to generate time slot badges
  const getDayBadge = (day: Date) => {
    const dayTimeSlots = timeSlots.filter(
      slot => slot.date === format(day, 'yyyy-MM-dd')
    );
    
    if (dayTimeSlots.length > 0) {
      return <Badge variant="outline" className="absolute bottom-0 right-0 h-2 w-2 bg-primary rounded-full" />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Staff Calendar</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4" />
            <span>{format(date, 'MMMM yyyy')}</span>
          </div>
          <Button variant="outline" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2 border rounded-md p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="rounded-md"
            components={{
              DayContent: (props: DayContentProps) => (
                <div className="relative w-full h-full flex items-center justify-center">
                  {format(props.date, 'd')}
                  {getDayBadge(props.date)}
                </div>
              ),
            }}
          />
        </div>
        
        <div className="md:w-1/2 border rounded-md p-4">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p>Loading time slots...</p>
            </div>
          ) : selectedTimeSlots.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {selectedTimeSlots.map((slot) => (
                <div 
                  key={slot.id}
                  className="p-3 border rounded-md hover:bg-secondary/20 cursor-pointer flex justify-between"
                >
                  <span className="text-sm">{slot.startTime} - {slot.endTime}</span>
                  <Badge variant={slot.status === 'available' ? 'outline' : 'destructive'}>
                    {slot.status === 'available' ? 'Available' : 'Booked'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">No time slots available for this date</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffCalendar;
