import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BookingWidget from './BookingWidget';

// Mock Cal.com embed
const mockCalOn = vi.fn();
const mockGetCalApi = vi.fn(() => Promise.resolve({ on: mockCalOn }));
vi.mock('@calcom/embed-react', () => ({
  default: (props: any) => <div data-testid="cal-embed" {...props} />, // Mock Cal component
  getCalApi: () => mockGetCalApi(),
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  toast: mockToast,
}));

// Original import.meta.env
const originalEnv = { ...import.meta.env };

describe('BookingWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset import.meta.env to a copy of the original before each test
    import.meta.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original import.meta.env after each test
    import.meta.env = originalEnv;
  });

  it('renders "Booking is currently unavailable" when VITE_CAL_LINK is not set in production', () => {
    import.meta.env.VITE_CAL_LINK = undefined;
    import.meta.env.PROD = true;
    import.meta.env.DEV = false;

    render(<BookingWidget />);
    expect(screen.getByText('Booking is currently unavailable. Please contact support.')).toBeInTheDocument();
    expect(screen.queryByTestId('cal-embed')).not.toBeInTheDocument();
  });

  it('logs a warning and renders fallback when VITE_CAL_LINK is not set in development', () => {
    import.meta.env.VITE_CAL_LINK = undefined;
    import.meta.env.DEV = true;
    import.meta.env.PROD = false;
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<BookingWidget />);
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Cal] Environment variable VITE_CAL_LINK is not set. Using fallback link for development. Please set this variable in your .env file.'
    );
    expect(screen.getByTestId('cal-embed')).toBeInTheDocument();
    expect(screen.queryByText('Booking is currently unavailable. Please contact support.')).not.toBeInTheDocument();
    
    consoleWarnSpy.mockRestore();
  });

  it('triggers a toast notification on bookingFailed event', async () => {
    import.meta.env.VITE_CAL_LINK = 'test-cal-link';
    import.meta.env.PROD = true; // Or DEV, doesn't matter for this test as long as link is set

    render(<BookingWidget />);

    // Wait for getCalApi to resolve and event listeners to be attached
    await waitFor(() => expect(mockGetCalApi).toHaveBeenCalled());
    
    // Simulate the bookingFailed event
    // Find the callback for 'bookingFailed'
    const bookingFailedCallback = mockCalOn.mock.calls.find(call => call[0].action === 'bookingFailed')?.[0].callback;
    expect(bookingFailedCallback).toBeDefined();

    if (bookingFailedCallback) {
      bookingFailedCallback({ detail: { error: 'Test booking failure' } });
    }
    
    expect(mockToast).toHaveBeenCalledWith({
      variant: "destructive",
      title: "Booking Failed",
      description: "We couldn't confirm your booking. Please try again or contact support if the issue persists.",
    });
  });
});
