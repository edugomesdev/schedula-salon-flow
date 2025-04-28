
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateTimeSlots, formatTimeSlotEvent } from '@/utils/calendar';
import type { TimeSlot, CalendarEvent } from '@/types/calendar';

export const useCalendarData = (staffIds: string[], date: Date) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchTimeSlots = async (currentDate: Date) => {
    setLoading(true);
    try {
      // If no staffIds are provided, return empty array
      if (!staffIds.length) {
        setEvents([]);
        return;
      }

      // Fetch stylist names for better event display
      const { data: stylists, error: stylistError } = await supabase
        .from('stylists')
        .select('id, name')
        .in('id', staffIds);
      
      if (stylistError) throw stylistError;
      
      // Create a map of stylist ids to their names
      const stylistMap = new Map();
      stylists?.forEach(stylist => {
        stylistMap.set(stylist.id, stylist.name);
      });

      // Fetch calendar entries for all selected stylists
      const { data: entries, error } = await supabase
        .from('calendar_entries')
        .select('*')
        .in('stylist_id', staffIds);
      
      if (error) throw error;
      
      const monthDays = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      });
      
      // Generate empty time slots for each stylist and each day
      let generatedEvents: CalendarEvent[] = [];
      
      staffIds.forEach((staffId, stylistIndex) => {
        monthDays.forEach(day => {
          const timeSlots = generateTimeSlots(day);
          // Convert to calendar events with stylist info
          const events = timeSlots.map(slot => formatTimeSlotEvent({
            ...slot,
            stylistId: staffId
          }, stylistMap.get(staffId), stylistIndex));
          
          generatedEvents = [...generatedEvents, ...events];
        });
      });
      
      // Update slots with actual booking data
      entries?.forEach(entry => {
        const entryDate = format(new Date(entry.start_time), 'yyyy-MM-dd');
        const entryStartTime = format(new Date(entry.start_time), 'H:mm');
        const entryEndTime = format(new Date(entry.end_time), 'H:mm');
        
        const eventIndex = generatedEvents.findIndex(
          event => 
            event.date === entryDate && 
            event.startTime === entryStartTime &&
            event.endTime === entryEndTime &&
            event.stylistId === entry.stylist_id
        );
        
        if (eventIndex !== -1) {
          generatedEvents[eventIndex] = {
            ...generatedEvents[eventIndex],
            title: entry.title || entry.client_name || 'Booked',
            clientName: entry.client_name || undefined,
            serviceName: entry.service_name || undefined,
            status: entry.client_name ? 'booked' : 'available'
          };
        }
      });
      
      setEvents(generatedEvents);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch calendar data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSlots(date);
  }, [date, staffIds]);

  return { events, loading, refetch: () => fetchTimeSlots(date) };
};
