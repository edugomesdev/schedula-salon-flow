
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Building } from 'lucide-react';
import { useServiceModal } from '@/hooks/services/useServiceModal';
import { useNavigate } from 'react-router-dom';

export const ServiceHeader = () => {
  const { openModal } = useServiceModal();
  const navigate = useNavigate();
  
  const handleAddService = () => {
    openModal(); // Call openModal with no parameters to add a new service
  };
  
  const handleAddSalon = () => {
    // Navigate to a page where users can add a salon
    // For now, we'll just redirect to a hypothetical salon creation page
    navigate('/dashboard/settings');
  };
  
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold">Service Menu</h1>
        <p className="text-muted-foreground">
          Manage your salon's offerings and pricing
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={handleAddSalon} variant="outline" className="gap-2">
          <Building className="h-4 w-4" />
          Add Salon
        </Button>
        <Button onClick={handleAddService} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Service
        </Button>
      </div>
    </div>
  );
};
