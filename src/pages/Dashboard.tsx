import React, { useEffect } from 'react';
// import { useAuth } from '@/lib/auth'; // 'user' from useAuth was unused (Source 1331)
import DashboardLayout from '@/components/layouts/DashboardLayout'; // [✓] Source 1331
import DashboardMetrics from '@/components/dashboard/DashboardMetrics'; // [✓] Source 1332
import { useSalon } from '@/hooks/dashboard/useSalon'; // [✓] Source 1332
import { useAppointmentsData } from '@/hooks/dashboard/useAppointmentsData'; // [✓] Source 1333
import { useSalonData } from '@/hooks/dashboard/useSalonData'; // [✓] Source 1333

const Dashboard = () => {
  // const { user } = useAuth(); // 'user' was unused (Source 1331)
  const { salon, isLoading: isSalonLoading } = useSalon(); // Added isLoading for salon
  const salonId = salon?.id;

  const { upcomingAppointments, totalAppointments } = useAppointmentsData(salonId);
  const { services, staff } = useSalonData(salonId);

  useEffect(() => {
    console.log('Dashboard rendered with salonId:', salonId); // [✓] Source 1334
    console.log('Services metrics:', services); // [✓] Source 1334
    console.log('Staff metrics:', staff); // [✓] Source 1334
  }, [salonId, services, staff]);


  // Handle loading state for the overall dashboard data
  const isLoadingData = 
    isSalonLoading || 
    upcomingAppointments.isLoading || 
    totalAppointments.isLoading || 
    services.isLoading || 
    staff.isLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        {isLoadingData ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* You can replace these with Skeleton components from shadcn/ui for a better loading experience */}
            <p>Loading metrics...</p> 
            <p>Loading metrics...</p>
            <p>Loading metrics...</p>
            <p>Loading metrics...</p>
          </div>
        ) : (
          <DashboardMetrics
            upcomingAppointments={upcomingAppointments}
            totalAppointments={totalAppointments}
            services={services}
            staff={staff}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
