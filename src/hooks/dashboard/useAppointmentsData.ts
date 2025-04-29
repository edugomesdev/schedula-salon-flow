
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAppointmentsData = (salonId: string | null) => {
  // Fetch upcoming appointments count
  const upcomingAppointments = useQuery({
    queryKey: ['upcomingAppointments', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      const now = new Date().toISOString();
      console.log('Fetching upcoming appointments after:', now);
      
      // Query calendar_entries for upcoming appointments
      const { data, error } = await supabase
        .from('calendar_entries')
        .select('*')
        .gte('start_time', now);
      
      if (error) {
        console.error('Error fetching upcoming appointments:', error);
        throw error;
      }
      
      console.log('Upcoming appointments found:', data?.length || 0);
      return data?.length || 0;
    },
    enabled: !!salonId
  });

  // Fetch total appointments (all time)
  const totalAppointments = useQuery({
    queryKey: ['totalAppointments', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      console.log('Fetching all appointments from calendar entries');
      
      // Query calendar_entries for all appointments
      const { data, error } = await supabase
        .from('calendar_entries')
        .select('*');
      
      if (error) {
        console.error('Error fetching total appointments:', error);
        throw error;
      }
      
      console.log('Total appointments found:', data?.length || 0);
      return data?.length || 0;
    },
    enabled: !!salonId
  });

  return {
    upcomingAppointments: {
      count: upcomingAppointments.data || 0,
      isLoading: upcomingAppointments.isLoading
    },
    totalAppointments: {
      count: totalAppointments.data || 0,
      isLoading: totalAppointments.isLoading
    }
  };
};
