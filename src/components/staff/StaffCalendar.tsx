
import { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarView } from './calendar/CalendarView';
import { TimeSlotList } from './calendar/TimeSlotList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarEntryForm } from './calendar/CalendarEntryForm';
import { useCalendarData } from '@/hooks/useCalendarData';
import type { StaffCalendarProps, TimeSlot, CalendarEvent } from '@/types/calendar';

const StaffCalendar = ({ staffId }: StaffCalendarProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<CalendarEvent[]>([]);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const { toast } = useToast();
  
  const { events, loading, refetch } = useCalendarData([staffId], date);
  
  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;
    
    setSelectedDate(newDate);
    const slotsForDay = events.filter(
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
    refetch();
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
            timeSlots={events}
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
