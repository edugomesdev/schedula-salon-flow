declare module '@calcom/embed-react' {
  import * as React from 'react';

  /* ———<Embed component>——— */
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

  /* ———<Event names>——— */
  export type CalAction =
    | 'eventTypeSelected'
    | 'linkFailed'
    | 'linkReady'
    | 'bookingSuccessful'
    | 'bookingSuccessfulV2'
    | 'rescheduleBookingSuccessful'
    | 'rescheduleBookingSuccessfulV2'
    | 'bookingCancelled'
    | 'bookingFailed'          // <‑ you added these three
    | 'calLoaded'
    | 'error'
    | 'pageRendered'
    | '__dimensionChanged'
    | '__iframeReady';

  export interface CalEvent {
    action: CalAction;
    payload?: unknown;
  }

  /* ———<Runtime API wrapper>——— */
  export interface CalApi {
    on  (e: { action: CalAction; callback: (p?: unknown) => void }): void;
    off (e: { action: CalAction; callback: (p?: unknown) => void }): void;
    preload(details: { calLink: string }): void;
    namespace: Record<string, unknown>;
  }

  /* ———<exports>——— */
  const CalEmbed: (p: CalProps) => JSX.Element;
  export default CalEmbed;

  export function getCalApi(cfg?: {
    calOrigin?: string;
    debug?: boolean;
    uiDebug?: boolean;
  }): Promise<CalApi>;
}

/* ———<Global window.Cal>——— */
declare global {
  interface GlobalCalWithNs {
    (method: string, args?: unknown): void;
    on  (e: { action: string; callback: (p?: unknown) => void }): void;
    off (e: { action: string; callback: (p?: unknown) => void }): void;
    send?(action: string, payload?: unknown): void;
    namespace?: Record<string, unknown>;
  }

  // merge with Window from lib.dom.d.ts
  interface Window {
    Cal: GlobalCalWithNs;
  }
}