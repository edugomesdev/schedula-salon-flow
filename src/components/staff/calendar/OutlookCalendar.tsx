
import { useEffect } from 'react';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarMainView } from './CalendarMainView';
import { CalendarEventDialog } from './CalendarEventDialog';
import { useCalendarState } from '@/hooks/useCalendarState';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const OutlookCalendar = () => {
  const {
    date,
    viewType,
    selectedStaffIds,
    isAddEntryOpen,
    selectedEvent,
    showSideBySide,
    staffNames,
    events,
    loading,
    filteredEvents,
    setSelectedStaffIds,
    setIsAddEntryOpen,
    setStaffNames,
    setSelectedEvent,
    handleDateSelect,
    handleEventClick,
    navigatePrevious,
    navigateNext,
    navigateToday,
    handleViewChange,
    handleAddSuccess,
    toggleSideBySide,
    refetch
  } = useCalendarState();

  const { toast } = useToast();

  // Fetch staff names when staff IDs change
  useEffect(() => {
    const fetchStaffNames = async () => {
      if (selectedStaffIds.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('stylists')
          .select('id, name')
          .in('id', selectedStaffIds);
          
        if (error) throw error;
        
        const nameMap = new Map();
        data?.forEach(staff => {
          nameMap.set(staff.id, staff.name);
        });
        
        setStaffNames(nameMap);
      } catch (error) {
        console.error('Error fetching staff names:', error);
        toast({
          title: 'Error',
          description: 'Failed to load staff names. Please try again.',
          variant: 'destructive'
        });
      }
    };
    
    fetchStaffNames();
  }, [selectedStaffIds, setStaffNames, toast]);
  
  // Group events by staff member
  const staffEventsGroups = selectedStaffIds.map(staffId => {
    const staffEvents = events.filter(event => event.stylistId === staffId);
    return {
      staffId,
      staffName: staffNames.get(staffId) || 'Staff Member',
      events: staffEvents
    };
  });
  
  useEffect(() => {
    if (events.length === 0 && !loading && selectedStaffIds.length > 0) {
      toast({
        title: 'Calendar Cleared',
        description: 'All calendar entries have been deleted.',
      });
    }
  }, [events, loading, selectedStaffIds, toast]);
  
  return (
    <div className="space-y-4">
      <CalendarToolbar
        date={date}
        viewType={viewType}
        selectedStaffIds={selectedStaffIds}
        showSideBySide={showSideBySide}
        onPrevious={navigatePrevious}
        onNext={navigateNext}
        onToday={navigateToday}
        onViewChange={handleViewChange}
        onStaffSelectionChange={setSelectedStaffIds}
        onToggleSideBySide={toggleSideBySide}
      />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading calendar...</p>
        </div>
      ) : selectedStaffIds.length === 0 ? (
        <div className="flex justify-center items-center h-64 border rounded-md bg-gray-50">
          <p>Please select at least one staff member to view their calendar</p>
        </div>
      ) : (
        <CalendarMainView
          viewType={viewType}
          selectedDate={date}
          events={filteredEvents}
          staffEventsGroups={staffEventsGroups}
          showSideBySide={showSideBySide}
          onEventClick={handleEventClick}
          onDateSelect={handleDateSelect}
          onDateChange={handleDateSelect}
        />
      )}
      
      <CalendarEventDialog
        open={isAddEntryOpen}
        onOpenChange={setIsAddEntryOpen}
        selectedEvent={selectedEvent}
        selectedStaffId={selectedStaffIds.length > 0 ? selectedStaffIds[0] : ''}
        selectedDate={date}
        onSuccess={handleAddSuccess}
        onCancel={() => {
          setIsAddEntryOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};
