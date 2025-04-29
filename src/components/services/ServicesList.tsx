
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ServiceCard from './ServiceCard';
import { ServiceModal } from './ServiceModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';

const ServicesList = () => {
  const { user } = useAuth();
  
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
    enabled: !!user,
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', salonData?.id],
    queryFn: async () => {
      if (!salonData?.id) return [];
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonData.id)
        .order('name');
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!salonData?.id,
  });

  if (isLoading) {
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

  if (!salonData?.id) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
        <h3 className="text-lg font-medium mb-2">No salon found</h3>
        <p className="text-muted-foreground mb-6">
          Please create a salon before adding services.
        </p>
      </div>
    );
  }

  if (services && services.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
        <h3 className="text-lg font-medium mb-2">No services added yet</h3>
        <p className="text-muted-foreground mb-6">
          Add your first service by clicking the button above.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services?.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
      <ServiceModal />
    </>
  );
};

export default ServicesList;
