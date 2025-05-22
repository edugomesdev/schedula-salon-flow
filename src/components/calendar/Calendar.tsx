
import { useCalendar } from '@/contexts/CalendarContext';
import { CalendarProvider } from '@/contexts/CalendarContext';
import { useStylists } from './hooks/useStylists';
import { useCalendarEntries } from './hooks/useCalendarEntries';
import { useAppointmentActions } from './hooks/useAppointmentActions';
import { useAppointmentReschedule } from '@/hooks/calendar/useAppointmentReschedule';
import { Stylist } from '@/types/calendar';
import { useEffect, useState } from 'react';
import CalendarDndProvider from './dnd/CalendarDndProvider';
import { toast as shadcnToast } from "@/hooks/use-toast"; // Renamed to avoid conflict if sonner is also used directly here

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

  // Set stylist visibility based on stylists list and initialStylistId prop
  useEffect(() => {
    if (stylists.length > 0) {
      const newVisibility: Record<string, boolean> = {};
      
      stylists.forEach(stylist => {
        // If initialStylistId is provided, only that stylist is visible.
        // Otherwise, all stylists are visible by default.
        if (initialStylistId) {
          newVisibility[stylist.id] = stylist.id === initialStylistId;
        } else {
          newVisibility[stylist.id] = true;
        }
      });
      
      setStylistVisibility(newVisibility);
    }
    // Intentionally not including stylistVisibility in dependencies to avoid loops.
    // This effect is meant to react to changes in stylists list or initialStylistId prop.
  }, [stylists, initialStylistId, setStylistVisibility]);

  // Note: A previous polling mechanism for stylists was removed from here.
  // The `useStylists` hook implements Supabase real-time subscriptions, 
  // which should keep the stylist list up-to-date.
  // Manual refresh options are available in the UI if needed.

  // If loading, show skeleton
  if (loadingStylists) {
    return <CalendarSkeleton />;
  }

  // Filter stylists based on visibility
  const visibleStylists = stylists.filter(stylist => stylistVisibility[stylist.id] !== false);

  // Handle drop event for drag-and-drop rescheduling
  const handleEntryDrop = async (entryId: string, newTime: Date, newStylistId?: string) => {
    try {
      // rescheduleAppointment itself handles success/error toasts via sonner
      // and calls refetchEntries on success.
      // We are adding a shadcn/ui toast here specifically for errors as per task requirements.
      await rescheduleAppointment(entryId, newTime, newStylistId);
      // If rescheduleAppointment throws, it will be caught below.
      // If it doesn't throw, it means it handled its own success notification.
    } catch (error) {
      // console.error removed as per task requirements; shadcnToast provides user feedback.
      // The error is also re-thrown, allowing upstream handlers or logging services to catch it.
      shadcnToast({
        variant: "destructive",
        title: "Reschedule Failed",
        description: "Could not move the appointment. Please try again or contact support if the issue persists.",
      });
      // It's important to re-throw the error if dnd-kit or other handlers
      // rely on promise rejection or exceptions to revert optimistic UI updates.
      // The useAppointmentReschedule hook already shows a sonner toast on error.
      // This additional shadcnToast is per explicit task instruction.
      throw error; 
    }
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
