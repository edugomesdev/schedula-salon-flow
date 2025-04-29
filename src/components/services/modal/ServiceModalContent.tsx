
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ServiceForm, ServiceFormValues } from './ServiceForm';
import { useServiceMutation } from './useServiceMutation';
import { useSalonQuery } from './useSalonQuery';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface ServiceModalContentProps {
  service: Service | null;
  closeModal: () => void;
}

export const ServiceModalContent = ({ 
  service, 
  closeModal 
}: ServiceModalContentProps) => {
  const { data: salonData, isLoading: salonLoading, error: salonError } = useSalonQuery();
  const { toast } = useToast();
  const isEditing = !!service;
  
  const defaultValues = {
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price || 0,
    duration: service?.duration || 60,
  };
  
  const mutation = useServiceMutation({
    salonId: salonData?.id,
    service,
    onSuccess: closeModal,
  });

  React.useEffect(() => {
    if (salonError) {
      toast({
        title: "Error fetching salon",
        description: "Please make sure you've created a salon first.",
        variant: "destructive",
      });
    }
  }, [salonError, toast]);
  
  const onSubmit = (values: ServiceFormValues) => {
    if (!salonData?.id) {
      toast({
        title: "No salon found",
        description: "Please create a salon first before adding services.",
        variant: "destructive",
      });
      closeModal();
      return;
    }
    
    mutation.mutate(values);
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit' : 'Add'} Service</DialogTitle>
        <DialogDescription>
          {isEditing ? 'Edit the details of your service.' : 'Add a new service to your salon menu.'}
        </DialogDescription>
      </DialogHeader>
      
      {salonLoading ? (
        <div className="py-6 text-center">Loading salon data...</div>
      ) : !salonData?.id ? (
        <div className="py-6 text-center text-destructive">
          <p className="mb-2">No salon found</p>
          <p className="text-sm text-muted-foreground">Please create a salon first before adding services.</p>
        </div>
      ) : (
        <ServiceForm 
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          onCancel={closeModal}
          isSubmitting={mutation.isPending}
          isEditing={isEditing}
        />
      )}
    </DialogContent>
  );
};
