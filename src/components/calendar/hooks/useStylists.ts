
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Stylist } from '@/types/calendar';
import { assignRandomColorsToStylists } from '@/utils/calendarUtils';

// Custom hook to fetch and manage stylists
export const useStylists = (salonId?: string) => {
  // Fetch stylists for the salon
  const { 
    data: stylists = [], 
    isLoading: loadingStylists
  } = useQuery({
    queryKey: ['stylists', salonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stylists')
        .select('*')
        .eq('salon_id', salonId || '');
        
      if (error) throw error;
      
      // Assign random colors to stylists that don't have one
      return assignRandomColorsToStylists(data || []);
    },
    enabled: !!salonId
  });

  return {
    stylists,
    loadingStylists
  };
};
