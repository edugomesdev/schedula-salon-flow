
import { useState, useEffect } from 'react';
import CalEmbed, { getCalApi } from '@calcom/embed-react';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';

interface BookingWidgetProps {
  /**
   * The Cal.com booking link (e.g., "your-username/salon-session")
   */
  bookingLink?: string;
  /**
   * Optional className for the container
   */
  className?: string;
}

export const BookingWidget = ({
  bookingLink = "your-username/salon-session",
  className = "",
}: BookingWidgetProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [calApiLoaded, setCalApiLoaded] = useState(false);

  useEffect(() => {
    // Safely load Cal.com embedded script
    try {
      const script = document.createElement('script');
      script.src = 'https://cal.com/embed.js';
      script.async = true;
      script.onload = () => {
        console.log('Cal.com embed script loaded');
        setCalApiLoaded(true);
        
        // Initialize events only after script is loaded
        if (window.Cal) {
          // Booking successful event
          window.Cal('on', {
            action: "bookingSuccessful",
            callback: () => {
              console.log('Booking successful');
              toast.success('Appointment booked successfully!');
            }
          });
          
          // Booking failed event
          window.Cal('on', {
            action: "bookingFailed",
            callback: () => {
              console.error('Booking failed');
              toast.error('Failed to book appointment. Please try again.');
            }
          });
          
          // Calendar loaded event
          window.Cal('on', {
            action: "calLoaded",
            callback: () => {
              console.log('Cal widget loaded');
              setIsLoading(false);
            }
          });
          
          // Error event
          window.Cal('on', {
            action: "error",
            callback: (error) => {
              console.error('Cal widget error:', error);
              setHasError(true);
              setIsLoading(false);
              toast.error('Failed to load booking calendar');
            }
          });
        }
      };
      script.onerror = () => {
        console.error('Failed to load Cal.com embed script');
        setHasError(true);
        setIsLoading(false);
        toast.error('Failed to initialize booking calendar');
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    } catch (error) {
      console.error('Error initializing Cal widget:', error);
      setIsLoading(false);
      setHasError(true);
      toast.error('Failed to initialize booking calendar');
    }
  }, []);

  return (
    <div className={`w-full flex flex-col items-center justify-center p-4 md:p-6 ${className}`}>
      {isLoading && (
        <div className="w-full flex flex-col items-center space-y-4">
          <Skeleton className="w-full h-16 mb-4" />
          <Skeleton className="w-full h-[500px]" />
        </div>
      )}
      
      {hasError && (
        <div className="w-full bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Unable to load booking calendar</h3>
          <p className="text-red-700">
            There was a problem loading the booking widget. Please try refreshing the page
            or contact us directly to book an appointment.
          </p>
        </div>
      )}
      
      <div id="cal-booking-placeholder" style={{
        width: '100%',
        height: '600px',
        minHeight: '600px',
        visibility: calApiLoaded ? 'visible' : 'hidden'
      }}>
        {calApiLoaded && (
          <CalEmbed
            calLink={bookingLink}
            style={{ width: '100%', height: '600px', minHeight: '600px' }}
            config={{
              hideEventTypeDetails: false,
              layout: 'month_view',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default BookingWidget;
