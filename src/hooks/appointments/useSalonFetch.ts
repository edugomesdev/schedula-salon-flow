
import { useQuery } from '@tanstack/react-query';
import { supabaseBrowser } from '@/integrations/supabase/browserClient';
import { useToast } from '@/hooks/use-toast';

export const useSalonFetch = () => {
  const { toast } = useToast();
  
  const { data: salonData, isLoading, error } = useQuery({
    queryKey: ['salon'],
    queryFn: async () => {
      const { data, error } = await supabaseBrowser
        .from('salons')
        .select('id')
        .limit(1);

      if (error) {
        toast({
          title: 'Error fetching salon data',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      if (!data || data.length === 0) {
        toast({
          title: 'No salon found',
          description: 'Please create a salon first',
        });
        return null;
      }

      return data[0];
    }
  });

  return { 
    salonId: salonData?.id || null,
    loading: isLoading,
    error
  };
};
