import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Calendar from './Calendar'; // This will render CalendarInner via providers
import { CalendarContextType } from '@/contexts/CalendarContext';
import { Stylist } from '@/types/calendar';

// --- Mocks ---

// Mock useCalendar context
const mockSetStylistVisibility = vi.fn();
const mockUseCalendar = vi.fn<[], Partial<CalendarContextType>>(() => ({
  selectedDate: new Date(),
  view: 'week',
  displayMode: 'combined',
  stylistVisibility: {}, // Initial empty visibility
  setStylistVisibility: mockSetStylistVisibility,
  // Add other required fields from CalendarContextType with default/mock values
  setSelectedDate: vi.fn(),
  nextDate: vi.fn(),
  prevDate: vi.fn(),
  setView: vi.fn(),
  toggleDisplayMode: vi.fn(),
  toggleStylistVisibility: vi.fn(),
  showAllStylists: vi.fn(),
  hideAllStylists: vi.fn(),
  viewDisplayText: 'Test Week',
}));
vi.mock('@/contexts/CalendarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/CalendarContext')>();
  return {
    ...actual,
    useCalendar: () => mockUseCalendar(), // Ensure this is used by CalendarInner
  };
});


// Mock useStylists hook
const mockStylists: Stylist[] = [
  { id: 'stylist-1', name: 'Stylist Uno', user_id: 'user-1', salon_id: 'salon-1', color: '#ff0000', image_url: null, services: [], working_hours_id: 'wh-1' },
  { id: 'stylist-2', name: 'Stylist Dos', user_id: 'user-2', salon_id: 'salon-1', color: '#00ff00', image_url: null, services: [], working_hours_id: 'wh-2' },
];
const mockUseStylists = vi.fn(() => ({
  stylists: mockStylists,
  loadingStylists: false,
  refetchStylists: vi.fn(),
}));
vi.mock('./hooks/useStylists', () => ({
  useStylists: () => mockUseStylists(),
}));

// Mock useCalendarEntries hook
const mockUseCalendarEntries = vi.fn(() => ({
  entries: [],
  loadingEntries: false,
  refetchEntries: vi.fn(),
}));
vi.mock('./hooks/useCalendarEntries', () => ({
  useCalendarEntries: () => mockUseCalendarEntries(),
}));

// Mock useAppointmentActions hook
const mockUseAppointmentActions = vi.fn(() => ({
  modalOpen: false,
  setModalOpen: vi.fn(),
  selectedAppointment: null,
  selectedTime: null,
  selectedStylistId: null,
  modalMode: 'create',
  handleSlotClick: vi.fn(),
  handleEntryClick: vi.fn(),
  handleSaveAppointment: vi.fn(),
}));
vi.mock('./hooks/useAppointmentActions', () => ({
  useAppointmentActions: () => mockUseAppointmentActions(),
}));

// Mock useAppointmentReschedule hook
const mockRescheduleAppointment = vi.fn();
const mockUseAppointmentReschedule = vi.fn(() => ({
  isRescheduling: false,
  rescheduleAppointment: mockRescheduleAppointment,
}));
vi.mock('@/hooks/calendar/useAppointmentReschedule', () => ({
  useAppointmentReschedule: () => mockUseAppointmentReschedule(),
}));

// Mock shadcn/ui useToast
const mockShadcnToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  toast: mockShadcnToast,
}));

// Mock CalendarDndProvider as it's a wrapper
vi.mock('./dnd/CalendarDndProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));


// --- Tests ---
describe('Calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset specific mock implementations if they are changed per test
    mockUseCalendar.mockImplementation(() => ({
      selectedDate: new Date(),
      view: 'week',
      displayMode: 'combined',
      stylistVisibility: {},
      setStylistVisibility: mockSetStylistVisibility,
      setSelectedDate: vi.fn(),
      nextDate: vi.fn(),
      prevDate: vi.fn(),
      setView: vi.fn(),
      toggleDisplayMode: vi.fn(),
      toggleStylistVisibility: vi.fn(),
      showAllStylists: vi.fn(),
      hideAllStylists: vi.fn(),
      viewDisplayText: 'Test Week',
    }));
    mockUseStylists.mockReturnValue({
      stylists: mockStylists,
      loadingStylists: false,
      refetchStylists: vi.fn(),
    });
  });

  describe('Stylist Visibility', () => {
    it('sets only initialStylistId to visible if provided', async () => {
      const initialStylistId = 'stylist-1';
      render(<Calendar salonId="salon-1" initialStylistId={initialStylistId} />);

      // Wait for useEffect in CalendarInner to run
      await waitFor(() => {
        expect(mockSetStylistVisibility).toHaveBeenCalled();
      });
      
      const expectedVisibility = {
        'stylist-1': true,
        'stylist-2': false,
      };
      expect(mockSetStylistVisibility).toHaveBeenCalledWith(expectedVisibility);
    });

    it('sets all stylists to visible if initialStylistId is NOT provided', async () => {
      render(<Calendar salonId="salon-1" />);

      await waitFor(() => {
        expect(mockSetStylistVisibility).toHaveBeenCalled();
      });

      const expectedVisibility = {
        'stylist-1': true,
        'stylist-2': true,
      };
      expect(mockSetStylistVisibility).toHaveBeenCalledWith(expectedVisibility);
    });
    
    it('does not set visibility if no stylists are loaded', async () => {
      mockUseStylists.mockReturnValue({
        stylists: [], // No stylists
        loadingStylists: false,
        refetchStylists: vi.fn(),
      });
      render(<Calendar salonId="salon-1" />);

      // Wait a bit to ensure useEffects could have run
      await new Promise(resolve => setTimeout(resolve, 0)); 

      expect(mockSetStylistVisibility).not.toHaveBeenCalled();
    });
  });

  describe('Drag-and-Drop Error Handling (handleEntryDrop)', () => {
    it('displays an error toast if rescheduleAppointment throws an error', async () => {
      const errorMessage = 'Network Error';
      mockRescheduleAppointment.mockRejectedValue(new Error(errorMessage));

      // Need to access handleEntryDrop. It's passed to CalendarContent.
      // We can't easily grab props of deep children directly with RTL.
      // For this test, we'll focus on the fact that handleEntryDrop is called from CalendarInner.
      // To test handleEntryDrop directly, we'd need to extract it or pass it as a prop to CalendarInner.
      // However, CalendarInner itself calls rescheduleAppointment.
      // We can simulate a drop by calling the function that would be triggered.
      // The actual `handleEntryDrop` is internal to CalendarInner.
      // We can't directly call it. We need to find a component that receives it.
      // Since CalendarContent receives it, let's mock it.

      vi.mock('./CalendarContent', () => ({
        default: (props: { onEntryDrop: Function }) => (
          <button data-testid="mock-drop-trigger" onClick={() => props.onEntryDrop('entry-1', new Date(), 'stylist-1')}>
            Trigger Drop
          </button>
        ),
      }));
      
      render(<Calendar salonId="salon-1" />);
      
      // Simulate the drop action.
      // This requires CalendarContent to be rendered and the button to be clicked.
      // Ensure displayMode is 'combined' for CalendarContent to render
      mockUseCalendar.mockReturnValue({
        ...mockUseCalendar(),
        displayMode: 'combined', 
        stylistVisibility: { 'stylist-1': true, 'stylist-2': true } // Ensure content is visible
      });

      // Re-render might be needed if displayMode was different initially
      // For simplicity, assume it's 'combined' from the start or the initial render covers it.
      // If not, one would need to trigger a state change for displayMode and re-render.

      const triggerButton = screen.getByTestId('mock-drop-trigger');
      
      // Use act for state updates resulting from event
      await act(async () => {
        triggerButton.click();
      });

      await waitFor(() => {
        expect(mockRescheduleAppointment).toHaveBeenCalledWith('entry-1', expect.any(Date), 'stylist-1');
      });
      
      await waitFor(() => {
        expect(mockShadcnToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Reschedule Failed",
          description: "Could not move the appointment. Please try again or contact support if the issue persists.",
        });
      });
    });
  });
});
