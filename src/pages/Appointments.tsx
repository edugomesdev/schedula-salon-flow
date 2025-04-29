
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AppointmentsHeader from '@/components/appointments/AppointmentsHeader';
import AppointmentsCalendar from '@/components/appointments/AppointmentsCalendar';
import AppointmentChat from '@/components/appointments/AppointmentChat';
import { useSalonFetch } from '@/hooks/appointments/useSalonFetch';

const Appointments = () => {
  const [searchParams] = useSearchParams();
  const stylistId = searchParams.get('stylistId');
  const { salonId, loading } = useSalonFetch();

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <AppointmentsHeader stylistId={stylistId} />

        <div className="bg-white rounded-lg shadow p-6">
          {salonId ? (
            <AppointmentsCalendar 
              salonId={salonId} 
              stylistId={stylistId} 
              isLoading={loading}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Loading calendar...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Add the chat component */}
      {salonId && (
        <AppointmentChat 
          salonId={salonId} 
          stylistId={stylistId}
        />
      )}
    </DashboardLayout>
  );
};

export default Appointments;
