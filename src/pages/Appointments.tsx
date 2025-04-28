
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Calendar from '@/components/calendar/Calendar';
import { useToast } from '@/hooks/use-toast';

const Appointments = () => {
  const { toast } = useToast();
  const [salonId, setSalonId] = useState<string | null>(null);

  // Get the first salon for the current user
  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const { data, error } = await supabase
          .from('salons')
          .select('id')
          .limit(1);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setSalonId(data[0].id);
        } else {
          toast({
            title: 'No salon found',
            description: 'Please create a salon first',
          });
        }
      } catch (error: any) {
        console.error('Error fetching salons:', error);
        toast({
          title: 'Error fetching salon data',
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    fetchSalons();
  }, [toast]);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Calendar Management</h1>
          <p className="text-muted-foreground">
            Manage your stylists' appointments and schedules
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {salonId ? (
            <Calendar salonId={salonId} />
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Loading calendar...</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Appointments;
