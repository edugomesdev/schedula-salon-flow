
import { useCalendar } from '@/contexts/CalendarContext';
import { CalendarProvider } from '@/contexts/CalendarContext';
import { useStylists } from './hooks/useStylists';
import { useCalendarEntries } from './hooks/useCalendarEntries';
import { useAppointmentActions } from './hooks/useAppointmentActions';
import { useAppointmentReschedule } from '@/hooks/calendar/useAppointmentReschedule';
import { Stylist } from '@/types/calendar';
import { useEffect, useState } from 'react';
import CalendarDndProvider from './dnd/CalendarDndProvider';

import CalendarHeader from './CalendarHeader';
import StylistToggle from './StylistToggle';
import CalendarContent from './CalendarContent';
import StylistCalendar from './StylistCalendar';
import AppointmentModal from './AppointmentModal';
import CalendarSkeleton from './CalendarSkeleton';

interface CalendarProps {
  salonId?: string;
  initialStylistId?: string | null;
  showRefreshButton?: boolean;
}

// Inner component to avoid context provider issues
const CalendarInner = ({ salonId, initialStylistId, showRefreshButton }: CalendarProps) => {
  const { 
    selectedDate, 
    view, 
    displayMode, 
    stylistVisibility,
    setStylistVisibility
  } = useCalendar();
  
  // Track if we've set initial visibility
  const [initialVisibilitySet, setInitialVisibilitySet] = useState(false);
  
  // Fetch stylists using custom hook
  const { stylists, loadingStylists, refetchStylists } = useStylists(salonId);
  
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

  // Handle appointment rescheduling
  const { rescheduleAppointment } = useAppointmentReschedule({ refetchEntries });

  // Set initial stylist visibility when stylists load
  useEffect(() => {
    if (stylists.length > 0 && !initialVisibilitySet) {
      console.log('[Calendar] Setting initial stylist visibility', { 
        stylists: stylists.length, 
        initialStylistId,
        stylistIds: stylists.map(s => s.id)
      });
      
      const newVisibility: Record<string, boolean> = {};
      
      stylists.forEach(stylist => {
        // If initialStylistId is provided, only make that stylist visible
        if (initialStylistId) {
          newVisibility[stylist.id] = stylist.id === initialStylistId;
        } else {
          // Otherwise make all stylists visible by default
          newVisibility[stylist.id] = true;
        }
      });
      
      setStylistVisibility(newVisibility);
      setInitialVisibilitySet(true);
      console.log('[Calendar] New visibility state:', newVisibility);
    }
  }, [stylists, initialStylistId, setStylistVisibility, initialVisibilitySet]);

  // Setup a polling mechanism to check for new stylists
  // This is a fallback in case the realtime subscription misses updates
  useEffect(() => {
    if (!salonId) return;
    
    const pollingInterval = setInterval(() => {
      refetchStylists();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(pollingInterval);
  }, [salonId, refetchStylists]);

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
    initialStylistId,
    stylistVisibility: Object.keys(stylistVisibility).length,
    initialVisibilitySet
  });

  // If loading, show skeleton
  if (loadingStylists) {
    return <CalendarSkeleton />;
  }

  // Filter stylists based on visibility
  const visibleStylists = stylists.filter(stylist => stylistVisibility[stylist.id] !== false);

  // Handle drop event for drag-and-drop rescheduling
  const handleEntryDrop = (entryId: string, newTime: Date, newStylistId?: string) => {
    console.log(`[Calendar] Entry ${entryId} dropped at ${newTime.toISOString()}`, { newStylistId });
    rescheduleAppointment(entryId, newTime, newStylistId);
  };

  return (
    <div className="space-y-4">
      <CalendarHeader onRefresh={showRefreshButton ? refetchEntries : undefined} />
      
      <div className="grid md:grid-cols-[250px_1fr] gap-4">
        <div>
          <StylistToggle 
            stylists={stylists} 
            onRefreshRequest={refetchStylists}
          />
        </div>
        
        {displayMode === 'combined' ? (
          // Combined view - all stylists in one calendar
          <CalendarContent
            stylists={stylists}
            entries={entries}
            onSlotClick={handleSlotClick}
            onEntryClick={handleEntryClick}
            onEntryDrop={handleEntryDrop}
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
                  onEntryDrop={handleEntryDrop}
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
    <CalendarDndProvider>
      <CalendarProvider>
        <CalendarInner {...props} />
      </CalendarProvider>
    </CalendarDndProvider>
  );
};

export default Calendar;
