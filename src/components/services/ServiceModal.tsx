
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useServiceModal } from '@/hooks/services/useServiceModal';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

const formSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be at least 0'),
  duration: z.coerce.number().min(5, 'Duration must be at least 5 minutes'),
});

export type ServiceFormValues = z.infer<typeof formSchema>;

export const ServiceModal = () => {
  const { isOpen, closeModal, service } = useServiceModal();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Fetch the salon_id for the current user
  const { data: salonData } = useQuery({
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
  
  const isEditing = !!service;
  
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service?.name || '',
      description: service?.description || '',
      price: service?.price || 0,
      duration: service?.duration || 60,
    },
  });
  
  React.useEffect(() => {
    if (service) {
      form.reset({
        name: service.name || '',
        description: service.description || '',
        price: service.price || 0,
        duration: service.duration || 60,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        price: 0,
        duration: 60,
      });
    }
  }, [form, service]);
  
  const mutation = useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      if (!salonData?.id) {
        throw new Error('No salon found for this user');
      }
      
      const serviceData = {
        ...values,
        salon_id: salonData.id,
      };
      
      if (isEditing && service?.id) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id);
          
        if (error) throw error;
        return { ...service, ...serviceData };
      } else {
        const { data, error } = await supabase
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
        description: `${form.getValues().name} has been ${isEditing ? 'updated' : 'added'} to your service menu.`,
      });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} service: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (values: ServiceFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Service</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Haircut & Style" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Briefly describe this service..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min="5" step="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending || !salonData?.id}>
                {mutation.isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Service'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
