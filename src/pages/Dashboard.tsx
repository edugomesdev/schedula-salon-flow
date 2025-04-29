
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Scissors, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user } = useAuth();
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
            variant: 'destructive'
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

  // Fetch upcoming appointments count - checking calendar_entries table instead
  const { data: upcomingAppointmentsCount = 0, isLoading: loadingAppointments } = useQuery({
    queryKey: ['upcomingAppointments', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      const now = new Date().toISOString();
      console.log('Fetching upcoming appointments after:', now);
      
      // Query calendar_entries for upcoming appointments
      const { data, error } = await supabase
        .from('calendar_entries')
        .select('*')
        .gte('start_time', now);
      
      if (error) {
        console.error('Error fetching upcoming appointments:', error);
        throw error;
      }
      
      console.log('Upcoming appointments found:', data?.length || 0);
      return data?.length || 0;
    },
    enabled: !!salonId
  });

  // Fetch active services count
  const { data: serviceCount = 0, isLoading: loadingServices } = useQuery({
    queryKey: ['serviceCount', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      const { data, error } = await supabase
        .from('services')
        .select('*');
      
      if (error) {
        console.error('Error fetching services:', error);
        throw error;
      }
      
      return data?.length || 0;
    },
    enabled: !!salonId
  });

  // Fetch staff count
  const { data: staffCount = 0, isLoading: loadingStaff } = useQuery({
    queryKey: ['staffCount', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      const { data, error } = await supabase
        .from('stylists')
        .select('*');
      
      if (error) {
        console.error('Error fetching stylists:', error);
        throw error;
      }
      
      return data?.length || 0;
    },
    enabled: !!salonId
  });

  // Fetch total appointments (all time) - checking calendar_entries table instead
  const { data: totalAppointmentsCount = 0, isLoading: loadingTotalAppointments } = useQuery({
    queryKey: ['totalAppointments', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      console.log('Fetching all appointments from calendar entries');
      
      // Query calendar_entries for all appointments
      const { data, error } = await supabase
        .from('calendar_entries')
        .select('*');
      
      if (error) {
        console.error('Error fetching total appointments:', error);
        throw error;
      }
      
      console.log('Total appointments found:', data?.length || 0);
      return data?.length || 0;
    },
    enabled: !!salonId
  });

  const isLoading = loadingAppointments || loadingServices || loadingStaff || loadingTotalAppointments;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-2xl font-bold">Loading...</p>
              ) : (
                <p className="text-3xl font-bold">{upcomingAppointmentsCount}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-2xl font-bold">Loading...</p>
              ) : (
                <p className="text-3xl font-bold">{totalAppointmentsCount}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Services</CardTitle>
              <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-2xl font-bold">Loading...</p>
              ) : (
                <p className="text-3xl font-bold">{serviceCount}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-2xl font-bold">Loading...</p>
              ) : (
                <p className="text-3xl font-bold">{staffCount}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
