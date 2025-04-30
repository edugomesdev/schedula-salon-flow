
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSalonData = (salonId: string | null) => {
  // Fetch active services count
  const services = useQuery({
    queryKey: ['serviceCount', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      console.log('Fetching services for salon:', salonId);
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonId);
      
      if (error) {
        console.error('Error fetching services:', error);
        throw error;
      }
      
      console.log('Services found for salon:', data?.length || 0);
      return data?.length || 0;
    },
    enabled: !!salonId
  });

  // Fetch staff count
  const staff = useQuery({
    queryKey: ['staffCount', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      const { data, error } = await supabase
        .from('stylists')
        .select('*')
        .eq('salon_id', salonId);
      
      if (error) {
        console.error('Error fetching stylists:', error);
        throw error;
      }
      
      return data?.length || 0;
    },
    enabled: !!salonId
  });

  return {
    services: {
      count: services.data || 0,
      isLoading: services.isLoading
    },
    staff: {
      count: staff.data || 0,
      isLoading: staff.isLoading
    }
  };
};
