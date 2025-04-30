
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SalonData {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  phone?: string | null;
  owner_id?: string | null;
  email?: string | null;
}

export const useSalon = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { 
    data: salonData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['salon', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      console.log('Fetching salon for user:', user.id);
      
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);
        
      if (error) {
        console.error('Error fetching salon data:', error);
        throw error;
      }
      
      console.log('Salon fetch result:', data);
      return data && data.length > 0 ? data[0] as SalonData : null;
    },
    enabled: !!user,
  });

  // Handle errors
  if (error) {
    console.error("Salon query error:", error);
    toast({
      title: 'Error fetching salon data',
      description: (error as Error).message,
      variant: 'destructive',
    });
  }

  const updateSalon = async (updatedSalon: Partial<SalonData>) => {
    if (!salonData?.id) {
      return { success: false, error: 'No salon found to update' };
    }
    
    try {
      const { data, error } = await supabase
        .from('salons')
        .update(updatedSalon)
        .eq('id', salonData.id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Invalidate the query to refetch salon data
      queryClient.invalidateQueries({ queryKey: ['salon', user?.id] });
      
      return { success: true, data };
    } catch (error) {
      console.error("Error updating salon:", error);
      return { 
        success: false, 
        error: (error as Error).message || 'Error updating salon' 
      };
    }
  };

  return {
    salon: salonData,
    isLoading,
    error,
    refetch,
    updateSalon
  };
};
