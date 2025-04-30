
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Stylist } from '@/types/calendar';
import { assignRandomColorsToStylists } from '@/utils/calendarUtils';
import { useEffect } from 'react';

// Custom hook to fetch and manage stylists
export const useStylists = (salonId?: string) => {
  // Fetch stylists for the salon
  const { 
    data: stylists = [], 
    isLoading: loadingStylists,
    refetch: refetchStylists
  } = useQuery({
    queryKey: ['stylists', salonId],
    queryFn: async () => {
      console.log('[useStylists] Fetching stylists for salon:', salonId);
      const { data, error } = await supabase
        .from('stylists')
        .select('*')
        .eq('salon_id', salonId || '');
        
      if (error) {
        console.error('[useStylists] Error fetching stylists:', error);
        throw error;
      }
      
      console.log(`[useStylists] Fetched ${data?.length || 0} stylists`);
      
      // Assign random colors to stylists that don't have one
      return assignRandomColorsToStylists(data || []);
    },
    enabled: !!salonId
  });

  // Setup realtime subscription for stylists
  useEffect(() => {
    if (!salonId) return;
    
    console.log('[useStylists] Setting up realtime subscription for stylists');
    const channel = supabase
      .channel('stylist-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'stylists',
        },
        (payload) => {
          console.log('[useStylists] Received realtime update:', payload);
          // Refetch stylists when any changes occur
          refetchStylists();
        }
      )
      .subscribe((status) => {
        console.log('[useStylists] Realtime subscription status:', status);
      });

    return () => {
      console.log('[useStylists] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [salonId, refetchStylists]);

  return {
    stylists,
    loadingStylists,
    refetchStylists
  };
};
