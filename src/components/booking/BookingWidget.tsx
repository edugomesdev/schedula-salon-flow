
/**
 * BookingWidget
 * -------------
 * Embeds a Cal.com scheduling widget and wires up the three
 * custom events used by Schedula‑Salon‑Flow:
 *
 *   • bookingFailed
 *   • calLoaded
 *   • error
 *
 * The matching CalAction literals are declared in `src/types/calcom.d.ts`,
 * so TypeScript will now recognise `.on({ action: … })`.
 */

import React, { useEffect } from 'react';
import Cal, { getCalApi, CalAction } from '@calcom/embed-react';
import { toast } from '@/components/ui/use-toast';

interface BookingWidgetProps {
  bookingLink?: string;
}

/**
 * Your public Cal.com link.  Replace the placeholder path with
 * the slug you created inside Cal (e.g. "my‑workspace/consultation").
 */
const CAL_LINK = 'schedula-salon-flow/your-event';

const BookingWidget: React.FC<BookingWidgetProps> = ({ bookingLink }) => {
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        /** getCalApi loads the Cal runtime and returns the typed helper */
        const cal = await getCalApi({ debug: false });

        if (!mounted) return;

        // ———<EVENT LISTENERS>———————————————————————————

        cal.on({
          action: 'bookingFailed' as CalAction,
          callback: (payload) => {
            console.error('[Cal] bookingFailed →', payload);
            toast({
              title: "Booking Failed",
              description: "There was an issue with your booking. Please try again.",
              variant: "destructive"
            });
          },
        });

        cal.on({
          action: 'calLoaded' as CalAction,
          callback: () => {
            console.info('[Cal] Calendar finished loading');
          },
        });

        cal.on({
          action: 'error' as CalAction,
          callback: (err) => {
            console.error('[Cal] runtime error →', err);
            toast({
              title: "Error",
              description: "There was an error with the booking widget.",
              variant: "destructive"
            });
          },
        });
      } catch (err) {
        console.error('[Cal] getCalApi failed', err);
      }
    })();

    /** cleanup on unmount */
    return () => {
      mounted = false;
    };
  }, []);

  // ———<EMBED>———————————————————————————————————————
  return (
    <Cal
      calLink={bookingLink || CAL_LINK}
      /* Full‑width/height iframe; tweak to fit your design */
      style={{ width: '100%', height: '100%', border: 0 }}
      /* Runtime config passed to the embed */
      config={{
        layout: 'column_view',
        hideEventTypeDetails: false,
      }}
    />
  );
};

export default BookingWidget;
