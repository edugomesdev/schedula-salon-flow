
import { useState, useEffect } from 'react';
import { Cal, getCalApi } from '@calcom/embed-react';
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    // Initialize Cal embed API
    (async function initializeCalendar() {
      try {
        const cal = await getCalApi();
        // Log when the calendar is successfully loaded
        cal.on('app-ready', () => {
          console.log('Cal widget loaded');
          setIsLoading(false);
        });

        // Handle errors
        cal.on('error', () => {
          console.error('Failed to load Cal widget');
          setIsLoading(false);
          setHasError(true);
        });
      } catch (error) {
        console.error('Error initializing Cal widget:', error);
        setIsLoading(false);
        setHasError(true);
      }
    })();
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
      
      <Cal
        calLink={bookingLink}
        style={{ width: '100%', height: '600px', minHeight: '600px' }}
        config={{
          hideEventTypeDetails: false,
          layout: 'month_view',
        }}
      />
    </div>
  );
};

export default BookingWidget;
