
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseBrowser } from '@/integrations/supabase/browserClient';
import { useToast } from '@/hooks/use-toast';
import { ServiceFormValues } from './ServiceForm';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface UseServiceMutationProps {
  salonId?: string;
  service?: Service | null;
  onSuccess: () => void;
}

export const useServiceMutation = ({
  salonId,
  service,
  onSuccess,
}: UseServiceMutationProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!service;
  
  return useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      if (!salonId) {
        throw new Error('No salon found for this user');
      }
      
      // Ensure all required fields are present
      const serviceData = {
        salon_id: salonId,
        name: values.name,
        description: values.description || null,
        price: values.price,
        duration: values.duration
      };
      
      if (isEditing && service?.id) {
        const { error } = await supabaseBrowser
          .from('services')
          .update(serviceData)
          .eq('id', service.id);
          
        if (error) throw error;
        return { ...service, ...serviceData };
      } else {
        const { data, error } = await supabaseBrowser
          .from('services')
          .insert([serviceData])
          .select();
          
        if (error) throw error;
        return data[0];
      }
    },
    onSuccess: () => {
      toast({
        title: `Service ${isEditing ? 'updated' : 'created'} successfully`,
        description: `The service has been ${isEditing ? 'updated' : 'added'} to your service menu.`,
      });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} service: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
