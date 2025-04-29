
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ServiceForm, ServiceFormValues } from './ServiceForm';
import { useServiceMutation } from './useServiceMutation';
import { useSalonQuery } from './useSalonQuery';

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
  const { data: salonData } = useSalonQuery();
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
  
  const onSubmit = (values: ServiceFormValues) => {
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
      <ServiceForm 
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        onCancel={closeModal}
        isSubmitting={mutation.isPending}
        isEditing={isEditing}
      />
    </DialogContent>
  );
};
