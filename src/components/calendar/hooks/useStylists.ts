
import { useQuery } from '@tanstack/react-query';
import { supabaseBrowser } from '@/integrations/supabase/browserClient';
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
      const { data, error } = await supabaseBrowser
        .from('stylists')
        .select('*')
        .eq('salon_id', salonId || '');
        
      if (error) {
        // console.error removed, error is re-thrown
        throw error;
      }
      
      // Assign random colors to stylists that don't have one
      return assignRandomColorsToStylists(data || []);
    },
    enabled: !!salonId
  });

  // Setup realtime subscription for stylists
  useEffect(() => {
    if (!salonId) return;
    
    const channel = supabaseBrowser
      .channel('stylist-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'stylists',
        },
        (payload) => {
          // console.log removed; side effect is refetchStylists()
          refetchStylists();
        }
      )
      .subscribe((status) => {
        // console.log removed; subscription status is an internal detail
      });

    return () => {
      // console.log removed; cleanup is an internal detail
      supabaseBrowser.removeChannel(channel);
    };
  }, [salonId, refetchStylists]);

  return {
    stylists,
    loadingStylists,
    refetchStylists
  };
};
