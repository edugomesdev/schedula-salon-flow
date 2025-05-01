
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseBrowser } from '@/integrations/supabase/browserClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Dialog } from '@/components/ui/dialog';
import EditSalonDialog from '@/components/salon/EditSalonDialog';
import ServicesLoading from './ServicesLoading';
import NoSalonState from '@/components/salon/NoSalonState';
import SalonCard from '@/components/salon/SalonCard';
import EmptyServiceState from './EmptyServiceState';
import ServiceGrid from './ServiceGrid';
import { useSalon } from '@/hooks/dashboard/useSalon';

const ServicesList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { salon: salonData, isLoading: salonLoading, refetch: refetchSalon } = useSalon();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Fetch services data
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', salonData?.id],
    queryFn: async () => {
      if (!salonData?.id) return [];
      
      console.log("Fetching services for salon:", salonData.id);
      
      const { data, error } = await supabaseBrowser
        .from('services')
        .select('*')
        .eq('salon_id', salonData.id)
        .order('name');
        
      if (error) {
        console.error("Error fetching services:", error);
        throw error;
      }
      
      console.log("Services fetch result:", data);
      return data || [];
    },
    enabled: !!salonData?.id,
  });

  // Dialog handlers
  const handleOpenEditDialog = () => {
    console.log("Opening edit dialog with salon data:", salonData);
    setIsEditDialogOpen(true);
  };

  const handleSalonUpdated = () => {
    setIsEditDialogOpen(false);
    // Refetch salon data to update the UI
    console.log("Salon updated, refreshing data");
    refetchSalon();
  };

  // Loading state
  if (salonLoading || servicesLoading) {
    return <ServicesLoading />;
  }

  // No salon state
  if (!salonData) {
    return <NoSalonState />;
  }

  // Salon exists but no services
  if (services && services.length === 0) {
    return (
      <div className="space-y-8">
        <SalonCard salon={salonData} onEditClick={handleOpenEditDialog} />
        
        <EmptyServiceState />

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          {isEditDialogOpen && (
            <EditSalonDialog 
              salon={salonData}
              onClose={() => setIsEditDialogOpen(false)}
              onSaved={handleSalonUpdated}
            />
          )}
        </Dialog>
      </div>
    );
  }

  // Salon and services exist
  return (
    <>
      <div className="mb-8">
        <SalonCard salon={salonData} onEditClick={handleOpenEditDialog} />
      </div>
      
      <ServiceGrid services={services || []} />
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {isEditDialogOpen && (
          <EditSalonDialog 
            salon={salonData}
            onClose={() => setIsEditDialogOpen(false)}
            onSaved={handleSalonUpdated}
          />
        )}
      </Dialog>
    </>
  );
};

export default ServicesList;
