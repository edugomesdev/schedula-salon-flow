import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ServiceCard from './ServiceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Building, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import EditSalonDialog from '@/components/salon/EditSalonDialog';

const ServicesList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
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

  if (salonLoading || servicesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-6 bg-card rounded-lg border shadow-sm">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <Skeleton className="h-4 w-1/3 mb-6" />
            <div className="flex justify-between">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!salonData) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
        <h3 className="text-lg font-medium mb-2">No salon found</h3>
        <p className="text-muted-foreground mb-6">
          Please create a salon before adding services.
        </p>
      </div>
    );
  }

  // Display salon card and empty state when no services
  if (services && services.length === 0) {
    return (
      <div className="space-y-8">
        <Card className="border-primary/30 shadow-sm overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Building className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">{salonData.name}</h3>
            </div>
            
            {salonData.description && (
              <p className="text-muted-foreground mb-4">{salonData.description}</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mt-2">
              {salonData.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{salonData.location}</span>
                </div>
              )}
              
              {salonData.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{salonData.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/10 px-6 py-3">
            <Button 
              onClick={handleOpenEditDialog}
              variant="outline" 
              size="sm"
            >
              Edit Salon Details
            </Button>
          </CardFooter>
        </Card>
        
        <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
          <h3 className="text-lg font-medium mb-2">No services added yet</h3>
          <p className="text-muted-foreground mb-6">
            Add your first service by clicking the button above.
          </p>
        </div>

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

  return (
    <>
      <div className="mb-8">
        <Card className="border-primary/30 shadow-sm overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Building className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">{salonData.name}</h3>
            </div>
            
            {salonData.description && (
              <p className="text-muted-foreground mb-4">{salonData.description}</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mt-2">
              {salonData.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{salonData.location}</span>
                </div>
              )}
              
              {salonData.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{salonData.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/10 px-6 py-3">
            <Button 
              onClick={handleOpenEditDialog}
              variant="outline" 
              size="sm"
            >
              Edit Salon Details
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services?.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
      
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
