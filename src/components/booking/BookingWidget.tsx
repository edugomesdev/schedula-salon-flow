
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
 * The matching CalAction literals are declared in `src/types/calcom.d.ts`,
 * so TypeScript will now recognise `.on({ action: … })`.
 */

import React, { useEffect } from 'react';
import Cal, { getCalApi } from '@calcom/embed-react';
import { toast } from "@/hooks/use-toast";

/**
 * Your public Cal.com link.  Replace the placeholder path with
 * the slug you created inside Cal (e.g. "my‑workspace/consultation").
 */
// const CAL_LINK = 'schedula-salon-flow/your-event'; // Replaced by environment variable

const CAL_LINK_FALLBACK = 'schedula-salon-flow/your-event';
const VITE_CAL_LINK = import.meta.env.VITE_CAL_LINK;

const BookingWidget: React.FC = () => {
  useEffect(() => {
    if (!VITE_CAL_LINK && import.meta.env.PROD) {
      // Don't initialize Cal.com listeners if the link is not set in production
      return;
    }

    let mounted = true;

    (async () => {
      try {
        /** getCalApi loads the Cal runtime and returns the typed helper */
        const cal = await getCalApi({ debug: false });

        if (!mounted) return;

        // ———<EVENT LISTENERS>———————————————————————————

        cal.on({
          action: 'bookingFailed',
          callback: (payload) => {
            // console.error removed; toast provides user feedback.
            toast({
              variant: "destructive",
              title: "Booking Failed",
              description: "We couldn't confirm your booking. Please try again or contact support if the issue persists.",
            });
          },
        });

        cal.on({
          action: 'calLoaded',
          callback: () => {
            // console.info removed; this is a debug-level log.
          },
        });

        cal.on({
          action: 'error',
          callback: (err) => {
            // console.error removed; Cal.com errors are not directly actionable by end-users here.
            // Consider logging to an external service if detailed error tracking is needed.
          },
        });
      } catch (err) {
        // console.error removed; If getCalApi fails, the widget likely won't load, which is observable.
        // Consider specific user feedback if this becomes a common issue.
      }
    })();

    /** cleanup on unmount */
    return () => {
      mounted = false;
    };
  }, []);

  // ———<EMBED>———————————————————————————————————————

  if (!VITE_CAL_LINK) {
    if (import.meta.env.DEV) {
      console.warn(
        '[Cal] Environment variable VITE_CAL_LINK is not set. Using fallback link for development. Please set this variable in your .env file.'
      );
    } else {
      // Production environment without VITE_CAL_LINK
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Booking is currently unavailable. Please contact support.
        </div>
      );
    }
  }

  const calLinkToUse = VITE_CAL_LINK || CAL_LINK_FALLBACK;

  return (
    <Cal
      calLink={calLinkToUse}
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