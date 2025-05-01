
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabaseBrowser } from '@/integrations/supabase/browserClient';
import { CalendarEntry } from '@/types/calendar';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';

// Custom hook to fetch and manage calendar entries
export const useCalendarEntries = (selectedDate: Date, view: 'day' | 'week' | 'month') => {
  // Calculate date range for fetching calendar entries
  const getDateRange = () => {
    if (view === 'day') {
      const day = startOfDay(selectedDate);
      return { start: day, end: new Date(day.getTime() + 24 * 60 * 60 * 1000) };
    } else if (view === 'week') {
      return {
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
      };
    } else {
      // For month view, fetch a bit more data (previous and next month)
      return {
        start: startOfDay(subMonths(selectedDate, 1)),
        end: startOfDay(addMonths(selectedDate, 1))
      };
    }
  };

  const { start, end } = getDateRange();

  // Fetch calendar entries
  const { 
    data: entries = [], 
    refetch: refetchEntries,
    isLoading
  } = useQuery({
    queryKey: ['calendar-entries', start, end],
    queryFn: async () => {
      console.log(`[Calendar] Fetching entries for range: ${start.toISOString()} to ${end.toISOString()}`);
      const { data, error } = await supabaseBrowser
        .from('calendar_entries')
        .select('*')
        .gte('start_time', start.toISOString())
        .lt('end_time', end.toISOString());
        
      if (error) {
        console.error('[Calendar] Error fetching entries:', error);
        throw error;
      }
      console.log(`[Calendar] Fetched ${data?.length || 0} entries`);
      return data || [];
    }
  });

  // Setup realtime subscription for calendar entries
  useEffect(() => {
    console.log('[Calendar] Setting up realtime subscription');
    const channel = supabaseBrowser
      .channel('calendar-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_entries'
        },
        () => {
          console.log('[Calendar] Realtime update received, refetching entries');
          refetchEntries();
        }
      )
      .subscribe();

    return () => {
      console.log('[Calendar] Cleaning up realtime subscription');
      supabaseBrowser.removeChannel(channel);
    };
  }, [refetchEntries]);

  return {
    entries,
    refetchEntries,
    loadingEntries: isLoading // Using named export to match expected prop name
  };
};
