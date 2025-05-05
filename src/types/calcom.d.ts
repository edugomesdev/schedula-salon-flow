

declare module '@calcom/embed-react' {
  export interface CalProps {
    calLink: string;
    style?: React.CSSProperties;
    config?: {
      name?: string;
      email?: string;
      notes?: string;
      guests?: string[];
      theme?: string;
      hideEventTypeDetails?: boolean;
      layout?: 'month_view' | 'week_view' | 'column_view';
      [key: string]: any;
    };
    embedJsUrl?: string;
  }

  export interface CalApiConfig {
    calOrigin?: string;
    debug?: boolean;
    uiDebug?: boolean;
  }

  // Updated to include all documented and discovered Cal.com event types
  export type CalAction = 
    | "eventTypeSelected"
    | "linkFailed" 
    | "linkReady"
    | "bookingSuccessful"
    | "bookingSuccessfulV2"
    | "rescheduleBookingSuccessful"
    | "rescheduleBookingSuccessfulV2"
    | "bookingCancelled"
    | "bookingFailed"
    | "calLoaded"
    | "pageRendered"
    | "error"
    | "__dimensionChanged"
    | "__iframeReady";

  export interface CalApi {
    on: (event: { action: CalAction; callback: (args?: any) => void }) => void;
    off: (event: { action: CalAction; callback: (args?: any) => void }) => void;
    preload: (details: { calLink: string }) => void;
    namespace: {
      [namespace: string]: any;
    };
  }

  // Default export is the Cal component
  export default function CalEmbed(props: CalProps): JSX.Element;
  export function getCalApi(): Promise<CalApi>;
}

