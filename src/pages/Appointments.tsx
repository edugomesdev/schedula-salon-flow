import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AppointmentsHeader from '@/components/appointments/AppointmentsHeader';
import BookingWidget from '@/components/booking/BookingWidget';
import AppointmentChat from '@/components/appointments/AppointmentChat';
import { useSalonFetch } from '@/hooks/appointments/useSalonFetch';
import { useState, useEffect } from 'react';

const Appointments = () => {
  const [searchParams] = useSearchParams();
  const stylistId = searchParams.get('stylistId');
  const { salonId, loading } = useSalonFetch();
  const [bookingLink, setBookingLink] = useState<string>("your-username/salon-session");

  // Set a more specific booking link if we have a stylistId
  useEffect(() => {
    if (salonId) {
      // You can customize this booking link format based on your Cal.com account setup
      const baseLink = "your-username/salon-session";
      setBookingLink(stylistId 
        ? `${baseLink}?staff=${stylistId}`  // Pass stylist as a parameter to Cal.com
        : baseLink);
    }
  }, [salonId, stylistId]);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <AppointmentsHeader stylistId={stylistId} />

        <div className="bg-white rounded-lg shadow">
          {salonId ? (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-medium mb-2">Online Booking</h2>
                <p className="text-muted-foreground">
                  Clients can book appointments directly through this calendar.
                  Share your booking link with clients or embed it on your website.
                </p>
              </div>
              <BookingWidget 
                bookingLink={bookingLink}
                className="border rounded-lg"
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Loading booking widget...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Keep the chat component */}
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
