
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

  export type CalAction =
    | 'eventTypeSelected'
    | 'linkFailed'
    | 'linkReady'
    | 'bookingSuccessful'
    | 'bookingSuccessfulV2'
    | 'rescheduleBookingSuccessful'
    | 'rescheduleBookingSuccessfulV2'
    | 'bookingCancelled'
    | 'bookingFailed'
    | 'calLoaded'
    | 'error'
    | 'pageRendered'
    | '__dimensionChanged'
    | '__iframeReady';

  export interface CalEvent {
    action: CalAction;
    payload?: unknown;
  }

  export interface CalApi {
    on: (event: { action: CalAction; callback: (args?: any) => void }) => void;
    off: (event: { action: CalAction; callback: (args?: any) => void }) => void;
    preload: (details: { calLink: string }) => void;
    namespace: {
      [namespace: string]: any;
    };
  }

  export default function CalEmbed(props: CalProps): JSX.Element;
  export function getCalApi(): Promise<CalApi>;
}

// ✅ GLOBAL CAL DECLARATION FIXED
declare global {
  interface Window {
    Cal: {
      on: (event: { action: import('@calcom/embed-react').CalAction; callback: (args?: any) => void }) => void;
      off: (event: { action: import('@calcom/embed-react').CalAction; callback: (args?: any) => void }) => void;
      send?: (action: import('@calcom/embed-react').CalAction, payload?: unknown) => void;
      preload?: (details: { calLink: string }) => void;
    };
  }
}
declare global {
  interface GlobalCalWithNs {
    on: (event: { action: string; callback: (args?: any) => void }) => void;
    off: (event: { action: string; callback: (args?: any) => void }) => void;
    send?: (action: string, payload?: unknown) => void;
    (method: string, args?: any): void;
  }

  interface Window {
    Cal: GlobalCalWithNs;
  }
}