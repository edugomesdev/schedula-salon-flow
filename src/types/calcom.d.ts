
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

// Global declaration to make window.Cal available
declare global {
  interface Window {
    Cal: {
      on: (event: { action: string; callback: (args?: any) => void }) => void;
      off: (event: { action: string; callback: (args?: any) => void }) => void;
      send?: (action: string, payload?: unknown) => void;
      preload?: (details: { calLink: string }) => void;
      
      // Support for namespace calling pattern
      (method: string, args?: any): void;
      
      // Add support for namespaces
      namespace?: {
        [namespace: string]: any;
      };
    };
  }
}

export {};  // This is needed to make the file a module
