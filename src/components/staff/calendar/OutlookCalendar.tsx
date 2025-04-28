
import { useState, useEffect } from 'react';
import { format, addDays, addMonths, subMonths, subDays } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight,
} from 'lucide-react';
import { useCalendarData } from '@/hooks/useCalendarData';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarEntryForm } from './CalendarEntryForm';
import { CalendarViewSelector } from './CalendarViewSelector';
import { StaffSelector } from './StaffSelector';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { MultiCalendarView } from './MultiCalendarView';
import { getEventsForViewType } from '@/utils/calendar';
import { CalendarEvent, CalendarViewType } from '@/types/calendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const OutlookCalendar = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('week');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [staffNames, setStaffNames] = useState<Map<string, string>>(new Map());
  const { toast } = useToast();

  const { events, loading, refetch } = useCalendarData(selectedStaffIds, date);
  const filteredEvents = getEventsForViewType(events, viewType, date);
  
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
      }
    };
    
    fetchStaffNames();
  }, [selectedStaffIds]);
  
  const staffEventsGroups = selectedStaffIds.map(staffId => {
    const staffEvents = events.filter(event => event.stylistId === staffId);
    return {
      staffId,
      staffName: staffNames.get(staffId) || 'Staff Member',
      events: staffEvents
    };
  });
  
  const handleDateSelect = (newDate: Date) => {
    setDate(newDate);
  };
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsAddEntryOpen(true);
  };
  
  const navigatePrevious = () => {
    switch (viewType) {
      case 'day':
        setDate(subDays(date, 1));
        break;
      case 'week':
        setDate(subDays(date, 7));
        break;
      case 'month':
        setDate(subMonths(date, 1));
        break;
    }
  };
  
  const navigateNext = () => {
    switch (viewType) {
      case 'day':
        setDate(addDays(date, 1));
        break;
      case 'week':
        setDate(addDays(date, 7));
        break;
      case 'month':
        setDate(addMonths(date, 1));
        break;
    }
  };
  
  const navigateToday = () => {
    setDate(new Date());
  };
  
  const handleViewChange = (newViewType: CalendarViewType) => {
    setViewType(newViewType);
    if (newViewType !== 'month') {
      setShowSideBySide(false);
    }
  };
  
  const handleAddSuccess = () => {
    setIsAddEntryOpen(false);
    setSelectedEvent(null);
    refetch();
  };
  
  const renderCalendarView = () => {
    if (showSideBySide && selectedStaffIds.length > 1) {
      return (
        <MultiCalendarView 
          selectedDate={date}
          staffEvents={staffEventsGroups}
          onEventClick={handleEventClick}
          onDateChange={setDate}
        />
      );
    }
    
    const commonProps = {
      selectedDate: date,
      events: filteredEvents,
      onEventClick: handleEventClick,
      onDateSelect: handleDateSelect,
    };
    
    switch (viewType) {
      case 'day':
        return <DayView {...commonProps} />;
      case 'week':
        return <WeekView {...commonProps} />;
      case 'month':
        return <MonthView {...commonProps} />;
      default:
        return <WeekView {...commonProps} />;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <div className="flex gap-2 items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigatePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigateNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigateToday}
          >
            Today
          </Button>
          <h2 className="text-xl font-semibold">
            {viewType === 'day' ? format(date, 'MMMM d, yyyy') :
             viewType === 'week' ? `Week of ${format(date, 'MMMM d, yyyy')}` :
             format(date, 'MMMM yyyy')}
          </h2>
        </div>
        
        <div className="flex gap-2 items-center">
          {selectedStaffIds.length > 1 && viewType === 'month' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSideBySide(!showSideBySide)}
            >
              {showSideBySide ? 'Combined View' : 'Side by Side'}
            </Button>
          )}
          <CalendarViewSelector 
            viewType={viewType} 
            onViewChange={handleViewChange} 
          />
          <StaffSelector 
            selectedStaffIds={selectedStaffIds}
            onSelectionChange={setSelectedStaffIds}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading calendar...</p>
        </div>
      ) : selectedStaffIds.length === 0 ? (
        <div className="flex justify-center items-center h-64 border rounded-md bg-gray-50">
          <p>Please select at least one staff member to view their calendar</p>
        </div>
      ) : (
        renderCalendarView()
      )}
      
      <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEvent?.status === 'booked' ? 'Edit Calendar Entry' : 'Add Calendar Entry'}
            </DialogTitle>
          </DialogHeader>
          {selectedStaffIds.length > 0 && (
            <CalendarEntryForm
              stylistId={selectedEvent?.stylistId || selectedStaffIds[0]}
              selectedDate={date}
              startTime={selectedEvent?.startTime}
              endTime={selectedEvent?.endTime}
              clientName={selectedEvent?.clientName}
              serviceName={selectedEvent?.serviceName}
              onSuccess={handleAddSuccess}
              onCancel={() => {
                setIsAddEntryOpen(false);
                setSelectedEvent(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
