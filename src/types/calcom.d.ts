// src/types/calcom.d.ts  (or a *.d.ts that is included in tsconfig's "include")
declare module '@calcom/embed-react' {
  // … your CalProps & CalApiConfig unchanged …

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

  export interface CalApi {
    on<E extends CalAction>(
      event: { action: E; callback: (payload?: unknown) => void }
    ): void;
    off<E extends CalAction>(
      event: { action: E; callback: (payload?: unknown) => void }
    ): void;
    preload(opts: { calLink: string }): void;
    namespace: Record<string, unknown>;
  }

  const CalEmbed: React.FC<CalProps>;
  export default CalEmbed;
  export function getCalApi(): Promise<CalApi>;
}

// ---- global shim ----
declare global {
  // window.Cal itself
  interface GlobalCal extends Function {
    on<E extends string>(
      event: { action: E; callback: (payload?: unknown) => void }
    ): void;
    off<E extends string>(
      event: { action: E; callback: (payload?: unknown) => void }
    ): void;
    send?: (action: string, payload?: unknown) => void;
  }

  // Namespaced variant injected by the embed script:
  interface GlobalCalWithNs {
    namespace: Record<string, GlobalCal>;
    (method: string, args?: unknown): void;
    on: GlobalCal['on'];
    off: GlobalCal['off'];
  }

  // finally put it on Window
  interface Window {
    Cal: GlobalCalWithNs;
  }
}