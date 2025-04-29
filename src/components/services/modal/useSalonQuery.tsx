
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

export const useSalonQuery = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['salon', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log("No user found in useSalonQuery");
        return null;
      }
      
      console.log("Fetching salon for user:", user.id);
      
      const { data, error } = await supabase
        .from('salons')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);
        
      if (error) {
        console.error("Error in useSalonQuery:", error);
        throw error;
      }
      
      console.log("Salon query result:", data);
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!user,
  });
};
