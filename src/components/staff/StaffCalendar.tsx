import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarView } from './calendar/CalendarView';
import { TimeSlotList } from './calendar/TimeSlotList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarEntryForm } from './calendar/CalendarEntryForm';

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
    if (!selectedDate) {
      toast({
        title: 'Select a date',
        description: 'Please select a date before adding an entry.',
        variant: 'destructive',
      });
      return;
    }
    setIsAddEntryOpen(true);
  };

  const handleAddSuccess = () => {
    setIsAddEntryOpen(false);
    fetchTimeSlots(date);
  };

  const handleSlotClick = (startTime: string, endTime: string) => {
    if (!selectedDate) return;
    
    setIsAddEntryOpen(true);
    const form = document.querySelector('form');
    if (form) {
      const startTimeInput = form.querySelector('input[name="startTime"]') as HTMLInputElement;
      const endTimeInput = form.querySelector('input[name="endTime"]') as HTMLInputElement;
      if (startTimeInput) startTimeInput.value = startTime;
      if (endTimeInput) endTimeInput.value = endTime;
    }
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
            onSlotClick={handleSlotClick}
          />
        </div>
      </div>

      <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Calendar Entry</DialogTitle>
          </DialogHeader>
          {selectedDate && (
            <CalendarEntryForm
              stylistId={staffId}
              selectedDate={selectedDate}
              onSuccess={handleAddSuccess}
              onCancel={() => setIsAddEntryOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffCalendar;
