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
import { useSalon } from '@/hooks/dashboard/useSalon'; // [✓] Source 1197

const ServicesList = () => {
  // const { user } = useAuth(); // 'user' was unused (Source 1196)
  // const { toast } = useToast(); // 'toast' was unused (Source 1196)
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
        console.error("Error fetching services:", error); // [✓] Source 1199
        throw error;
      }
      console.log("Services fetch result:", data); // [✓] Source 1200
      return data || [];
    },
    enabled: !!salonData?.id, // Query only runs if salonData.id exists
  });

  // Dialog handlers
  const handleOpenEditDialog = () => {
    console.log("Opening edit dialog with salon data:", salonData); // [✓] Source 1201
    if (salonData) { // Ensure salonData exists before trying to open dialog with it
      setIsEditDialogOpen(true);
    } else {
      // Handle case where salonData might be null/undefined, perhaps show a toast
      console.warn("Attempted to open edit dialog without salon data.");
    }
  };

  const handleSalonUpdated = () => {
    setIsEditDialogOpen(false);
    // Refetch salon data to update the UI
    console.log("Salon updated, refreshing data"); // [✓] Source 1202
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
        {/* Ensure EditSalonDialog is only rendered when salonData is available */}
        {salonData && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                {isEditDialogOpen && ( /* Conditional rendering based on state */
                    <EditSalonDialog
                        salon={salonData}
                        onClose={() => setIsEditDialogOpen(false)}
                        onSaved={handleSalonUpdated}
                    />
                )}
            </Dialog>
        )}
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
      {/* Ensure EditSalonDialog is only rendered when salonData is available */}
      {salonData && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            {isEditDialogOpen && ( /* Conditional rendering based on state */
                <EditSalonDialog
                    salon={salonData}
                    onClose={() => setIsEditDialogOpen(false)}
                    onSaved={handleSalonUpdated}
                />
            )}
        </Dialog>
      )}
    </>
  );
};

export default ServicesList;
