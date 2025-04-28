
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const { user } = useAuth();
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
        }
      } catch (error) {
        console.error('Error fetching salons:', error);
      }
    };

    fetchSalons();
  }, []);

  // Fetch staff count
  const { data: staffCount = 0 } = useQuery({
    queryKey: ['staffCount', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      const { count, error } = await supabase
        .from('stylists')
        .select('*', { count: 'exact', head: true })
        .eq('salon_id', salonId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!salonId
  });

  // Fetch appointment count
  const { data: appointmentCount = 0 } = useQuery({
    queryKey: ['appointmentCount', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('salon_id', salonId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!salonId
  });

  // Fetch service count
  const { data: serviceCount = 0 } = useQuery({
    queryKey: ['serviceCount', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      const { count, error } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('salon_id', salonId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!salonId
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{appointmentCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{serviceCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Staff Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{staffCount}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
