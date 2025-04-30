
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

export const useSalon = () => {
  const { user } = useAuth();
  
  const { data: salonData, isLoading, error } = useQuery({
    queryKey: ['salon', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      console.log('Fetching salon for user:', user.id);
      
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', user.id)
        .limit(1);
        
      if (error) {
        console.error('Error fetching salon data:', error);
        throw error;
      }
      
      console.log('Salon fetch result:', data);
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!user,
  });

  return {
    salonId: salonData?.id || null,
    salonName: salonData?.name || null,
    isLoading,
    error
  };
};
