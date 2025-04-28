
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateTimeSlots } from '@/utils/calendar';
import type { TimeSlot } from '@/types/calendar';

export const useCalendarData = (staffId: string, date: Date) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchTimeSlots = async (currentDate: Date) => {
    setLoading(true);
    try {
      const { data: entries, error } = await supabase
        .from('calendar_entries')
        .select('*')
        .eq('stylist_id', staffId);
      
      if (error) throw error;
      
      const monthDays = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      });
      
      let generatedTimeSlots: TimeSlot[] = [];
      monthDays.forEach(day => {
        generatedTimeSlots = [...generatedTimeSlots, ...generateTimeSlots(day)];
      });
      
      entries?.forEach(entry => {
        const entryDate = format(new Date(entry.start_time), 'yyyy-MM-dd');
        const entryStartTime = format(new Date(entry.start_time), 'H:mm');
        const entryEndTime = format(new Date(entry.end_time), 'H:mm');
        
        const slotIndex = generatedTimeSlots.findIndex(
          slot => slot.date === entryDate && 
                 slot.startTime === entryStartTime &&
                 slot.endTime === entryEndTime
        );
        
        if (slotIndex !== -1) {
          generatedTimeSlots[slotIndex] = {
            ...generatedTimeSlots[slotIndex],
            status: entry.client_name ? 'booked' : 'available',
            clientName: entry.client_name || undefined,
            serviceName: entry.service_name || undefined
          };
        }
      });
      
      setTimeSlots(generatedTimeSlots);
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

  return { timeSlots, loading, refetch: () => fetchTimeSlots(date) };
};
