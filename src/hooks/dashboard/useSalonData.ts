import { useQuery } from '@tanstack/react-query';
import { supabaseBrowser } from '@/integrations/supabase/browserClient';

export const useSalonData = (salonId: string | null) => {
  // Fetch active services count
  const servicesQuery = useQuery<number, Error, number, (string | null | undefined)[]>({ // Explicit types for useQuery
    queryKey: ['serviceCount', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      console.log('Fetching services for salon:', salonId);
      
      // Get the current timestamp
      const now = new Date().toISOString();
      
      const { data, count, error } = await supabaseBrowser
        .from('services')
        .select('*', { count: 'exact', head: true }) // Use head:true and count for efficiency
        .eq('salon_id', salonId);

      if (error) {
        console.error('Error fetching services count:', error); // [✓] Source 1151
        throw error;
      }
      console.log('Services count for salon:', count); // [✓] Source 1152
      return count || 0;
    },
    enabled: !!salonId
  });

  // Fetch staff count
  const staffQuery = useQuery<number, Error, number, (string | null | undefined)[]>({ // Explicit types for useQuery
    queryKey: ['staffCount', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      const { data, count, error } = await supabaseBrowser
        .from('stylists')
        .select('*', { count: 'exact', head: true }) // Use head:true and count for efficiency
        .eq('salon_id', salonId);

      if (error) {
        console.error('Error fetching stylists count:', error); // [✓] Source 1153
        throw error;
      }
      return count || 0;
    },
    enabled: !!salonId
  });

  return {
    services: {
      count: servicesQuery.data ?? 0, // Use ?? 0 to provide a default if data is undefined
      isLoading: servicesQuery.isLoading
    },
    staff: {
      count: staffQuery.data ?? 0, // Use ?? 0
      isLoading: staffQuery.isLoading
    }
  };
};
