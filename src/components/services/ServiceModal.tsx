
import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { useServiceModal } from '@/hooks/services/useServiceModal';
import { ServiceModalContent } from './modal/ServiceModalContent';

export const ServiceModal = () => {
  const { isOpen, closeModal, service } = useServiceModal();
  
  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <ServiceModalContent 
        service={service} 
        closeModal={closeModal} 
      />
    </Dialog>
  );
};
