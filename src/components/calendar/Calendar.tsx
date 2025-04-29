
import { useCalendar } from '@/contexts/CalendarContext';
import { CalendarProvider } from '@/contexts/CalendarContext';
import { useStylists } from './hooks/useStylists';
import { useCalendarEntries } from './hooks/useCalendarEntries';
import { useAppointmentActions } from './hooks/useAppointmentActions';
import { Stylist } from '@/types/calendar';
import { useEffect } from 'react';

import CalendarHeader from './CalendarHeader';
import StylistToggle from './StylistToggle';
import CalendarContent from './CalendarContent';
import StylistCalendar from './StylistCalendar';
import AppointmentModal from './AppointmentModal';
import CalendarSkeleton from './CalendarSkeleton';

interface CalendarProps {
  salonId?: string;
  initialStylistId?: string | null;
}

// Inner component to avoid context provider issues
const CalendarInner = ({ salonId, initialStylistId }: CalendarProps) => {
  const { 
    selectedDate, 
    view, 
    displayMode, 
    stylistVisibility,
    setStylistVisibility
  } = useCalendar();
  
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

  // Set initial stylist visibility when stylists load
  useEffect(() => {
    if (stylists.length > 0) {
      const newVisibility: Record<string, boolean> = {};
      
      stylists.forEach(stylist => {
        // If initialStylistId is provided, only make that stylist visible
        if (initialStylistId) {
          newVisibility[stylist.id] = stylist.id === initialStylistId;
        } else {
          newVisibility[stylist.id] = true;
        }
      });
      
      setStylistVisibility(newVisibility);
    }
  }, [stylists, initialStylistId, setStylistVisibility]);

  // Debug log for tracking
  console.log('[Calendar] Rendering:', {
    stylists: stylists?.length,
    entries: entries?.length,
    modalOpen,
    selectedDate,
    view,
    displayMode,
    loadingStylists,
    loadingEntries,
    initialStylistId
  });

  // If loading, show skeleton
  if (loadingStylists) {
    return <CalendarSkeleton />;
  }

  // Filter stylists based on visibility
  const visibleStylists = stylists.filter(stylist => stylistVisibility[stylist.id] !== false);

  return (
    <div className="space-y-4">
      <CalendarHeader />
      
      <div className="grid md:grid-cols-[250px_1fr] gap-4">
        <div>
          <StylistToggle stylists={stylists} />
        </div>
        
        {displayMode === 'combined' ? (
          // Combined view - all stylists in one calendar
          <CalendarContent
            stylists={stylists}
            entries={entries}
            onSlotClick={handleSlotClick}
            onEntryClick={handleEntryClick}
          />
        ) : (
          // Split view - one calendar per stylist
          <div className={`grid gap-4 ${visibleStylists.length > 1 ? 'lg:grid-cols-2' : ''}`}>
            {visibleStylists.length === 0 ? (
              <div className="flex items-center justify-center border rounded-md p-8 text-center text-muted-foreground">
                No stylists selected. Please select at least one stylist to view their calendar.
              </div>
            ) : (
              visibleStylists.map((stylist: Stylist) => (
                <StylistCalendar
                  key={stylist.id}
                  stylist={stylist}
                  entries={entries}
                  onSlotClick={handleSlotClick}
                  onEntryClick={handleEntryClick}
                />
              ))
            )}
          </div>
        )}
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
