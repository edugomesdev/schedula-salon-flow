
import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/integrations/supabase/browserClient';
import { useToast } from '@/hooks/use-toast';

export const useSalonFetch = () => {
  const { toast } = useToast();
  const [salonId, setSalonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalons = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabaseBrowser
          .from('salons')
          .select('id')
          .limit(1);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setSalonId(data[0].id);
        } else {
          toast({
            title: 'No salon found',
            description: 'Please create a salon first',
          });
        }
      } catch (error: any) {
        console.error('Error fetching salons:', error);
        toast({
          title: 'Error fetching salon data',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSalons();
  }, [toast]);

  return { salonId, loading };
};
