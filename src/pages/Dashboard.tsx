
import React, { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import { useSalon } from '@/hooks/dashboard/useSalon';
import { useAppointmentsData } from '@/hooks/dashboard/useAppointmentsData';
import { useSalonData } from '@/hooks/dashboard/useSalonData';

const Dashboard = () => {
  const { user } = useAuth();
  const { salonId, isLoading: salonLoading } = useSalon();
  
  const { upcomingAppointments, totalAppointments } = useAppointmentsData(salonId);
  const { services, staff } = useSalonData(salonId);
  
  useEffect(() => {
    console.log('Dashboard rendered with salonId:', salonId);
    console.log('Services metrics:', services);
    console.log('Staff metrics:', staff);
  }, [salonId, services, staff]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        
        <DashboardMetrics
          upcomingAppointments={upcomingAppointments}
          totalAppointments={totalAppointments}
          services={services}
          staff={staff}
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
