
import { useQuery } from '@tanstack/react-query';
import { supabaseBrowser } from '@/integrations/supabase/browserClient';

export const useSalonData = (salonId: string | null) => {
  // Fetch active services count
  const services = useQuery({
    queryKey: ['serviceCount', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      console.log('Fetching services for salon:', salonId);
      
      // Get the current timestamp
      const now = new Date().toISOString();
      
      const { data, error } = await supabaseBrowser
        .from('services')
        .select('*')
        .eq('salon_id', salonId);
      
      if (error) {
        console.error('Error fetching services:', error);
        throw error;
      }
      
      // We're just counting the total services for now
      // If you want to filter for "active" services based on another criteria,
      // you can add additional filtering logic here
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
      
      const { data, error } = await supabaseBrowser
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
