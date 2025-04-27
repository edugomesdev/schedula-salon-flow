
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarView } from './calendar/CalendarView';
import { TimeSlotList } from './calendar/TimeSlotList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

const generateTimeSlots = (day: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  // Generate time slots from 9 AM to 5 PM
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

const StaffCalendar = ({ staffId }: StaffCalendarProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
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
      
      let generatedTimeSlots: TimeSlot[] = [];
      monthDays.forEach(day => {
        // Generate default available time slots for each day
        generatedTimeSlots = [...generatedTimeSlots, ...generateTimeSlots(day)];
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

  const handleAddEntry = () => {
    setIsAddEntryOpen(true);
  };

  return (
    <div className="space-y-6">
      <CalendarHeader 
        date={date}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onAddEntry={handleAddEntry}
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

      <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Calendar Entry</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>Calendar entry form will be implemented here</p>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setIsAddEntryOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffCalendar;
