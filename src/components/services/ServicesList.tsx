
import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Dialog } from '@/components/ui/dialog';
import EditSalonDialog from '@/components/salon/EditSalonDialog';
import ServicesLoading from './ServicesLoading';
import NoSalonState from '@/components/salon/NoSalonState';
import SalonCard from '@/components/salon/SalonCard';
import EmptyServiceState from './EmptyServiceState';
import ServiceGrid from './ServiceGrid';

const ServicesList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Fetch salon data
  const { data: salonData, isLoading: salonLoading, error: salonError } = useQuery({
    queryKey: ['salon', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      console.log("Fetching salon for user:", user.id);
      
      const { data, error } = await supabase
        .from('salons')
        .select('id, name, description, phone, location')
        .eq('owner_id', user.id)
        .limit(1);
        
      if (error) {
        console.error("Error fetching salon:", error);
        throw error;
      }
      
      console.log("Salon fetch result:", data);
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!user,
  });

  // Fetch services data
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', salonData?.id],
    queryFn: async () => {
      if (!salonData?.id) return [];
      
      console.log("Fetching services for salon:", salonData.id);
      
      const { data, error } = await supabase
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

  // Handle errors
  useEffect(() => {
    if (salonError) {
      console.error("Salon query error:", salonError);
      toast({
        title: 'Error fetching salon data',
        description: salonError.message,
        variant: 'destructive',
      });
    }
  }, [salonError, toast]);

  // Dialog handlers
  const handleOpenEditDialog = () => {
    console.log("Opening edit dialog with salon data:", salonData);
    setIsEditDialogOpen(true);
  };

  const handleSalonUpdated = () => {
    setIsEditDialogOpen(false);
    // Refetch salon data to update the UI
    console.log("Salon updated, refreshing data");
    queryClient.invalidateQueries({ queryKey: ['salon', user?.id] });
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

        {/* Edit Salon Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          {isEditDialogOpen && salonData && (
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
      
      {/* Edit Salon Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {isEditDialogOpen && salonData && (
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
