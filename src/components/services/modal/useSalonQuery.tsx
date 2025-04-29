
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

export const useSalonQuery = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['salon'],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('salons')
        .select('id')
        .eq('owner_id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
  });
};
