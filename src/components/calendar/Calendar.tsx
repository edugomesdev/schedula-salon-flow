
import { useCalendar } from '@/contexts/CalendarContext';
import { CalendarProvider } from '@/contexts/CalendarContext';
import { useStylists } from './hooks/useStylists';
import { useCalendarEntries } from './hooks/useCalendarEntries';
import { useAppointmentActions } from './hooks/useAppointmentActions';

import CalendarHeader from './CalendarHeader';
import StylistToggle from './StylistToggle';
import CalendarContent from './CalendarContent';
import AppointmentModal from './AppointmentModal';
import CalendarSkeleton from './CalendarSkeleton';

interface CalendarProps {
  salonId?: string;
}

// Inner component to avoid context provider issues
const CalendarInner = ({ salonId }: CalendarProps) => {
  const { selectedDate, view } = useCalendar();
  
  // Fetch stylists using custom hook
  const { stylists, loadingStylists } = useStylists(salonId);
  
  // Fetch calendar entries using custom hook
  const { entries, refetchEntries, loadingEntries } = useCalendarEntries(selectedDate, view);
  
  // Handle appointment actions using custom hook
  const { 
    modalOpen, 
    setModalOpen,
    selectedAppointment,
    selectedTime,
    selectedStylistId,
    modalMode,
    handleSlotClick,
    handleEntryClick,
    handleSaveAppointment
  } = useAppointmentActions({ refetchEntries });

  // Debug log for tracking
  console.log('[Calendar] Rendering:', {
    stylists: stylists?.length,
    entries: entries?.length,
    modalOpen,
    selectedDate,
    view,
    loadingStylists,
    loadingEntries
  });

  // If loading, show skeleton
  if (loadingStylists) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="space-y-4">
      <CalendarHeader />
      
      <div className="grid md:grid-cols-[250px_1fr] gap-4">
        <div>
          <StylistToggle stylists={stylists} />
        </div>
        
        <CalendarContent
          stylists={stylists}
          entries={entries}
          onSlotClick={handleSlotClick}
          onEntryClick={handleEntryClick}
        />
      </div>
      
      <AppointmentModal 
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAppointment}
        appointment={selectedAppointment}
        startTime={selectedTime}
        stylists={stylists}
        selectedStylistId={selectedStylistId}
        mode={modalMode}
      />
    </div>
  );
};

// Wrapper component with context provider
const Calendar = (props: CalendarProps) => {
  return (
    <CalendarProvider>
      <CalendarInner {...props} />
    </CalendarProvider>
  );
};

export default Calendar;
