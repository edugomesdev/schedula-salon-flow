
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useServiceModal } from '@/hooks/services/useServiceModal';

export const ServiceHeader = () => {
  const { openModal } = useServiceModal();
  
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold">Service Menu</h1>
        <p className="text-muted-foreground">
          Manage your salon's offerings and pricing
        </p>
      </div>
      <Button onClick={openModal} className="gap-2">
        <PlusCircle className="h-4 w-4" />
        Add Service
      </Button>
    </div>
  );
};
