
import { useState, useEffect } from 'react';
import { startOfDay, startOfWeek, endOfWeek, addMonths, subMonths, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CalendarProvider } from '@/contexts/CalendarContext';
import { useCalendar } from '@/contexts/CalendarContext';
import { CalendarEntry, Stylist } from '@/types/calendar';
import { assignRandomColorsToStylists } from '@/utils/calendarUtils';

import CalendarHeader from './CalendarHeader';
import StylistToggle from './StylistToggle';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';
import AppointmentModal from './AppointmentModal';

interface CalendarProps {
  salonId?: string;
}

// Inner component to avoid context provider issues
const CalendarInner = ({ salonId }: CalendarProps) => {
  const { selectedDate, view } = useCalendar();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarEntry | undefined>();
  const [selectedTime, setSelectedTime] = useState<Date | undefined>();
  const [selectedStylistId, setSelectedStylistId] = useState<string | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  // Fetch stylists for the salon
  const { data: stylists = [], isLoading: loadingStylists } = useQuery({
    queryKey: ['stylists', salonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stylists')
        .select('*')
        .eq('salon_id', salonId || '');
        
      if (error) throw error;
      
      // Assign random colors to stylists that don't have one
      return assignRandomColorsToStylists(data || []);
    },
    enabled: !!salonId
  });

  // Calculate date range for fetching calendar entries
  const getDateRange = () => {
    if (view === 'day') {
      const day = startOfDay(selectedDate);
      return { start: day, end: new Date(day.getTime() + 24 * 60 * 60 * 1000) };
    } else if (view === 'week') {
      return {
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
      };
    } else {
      // For month view, fetch a bit more data (previous and next month)
      return {
        start: startOfDay(subMonths(selectedDate, 1)),
        end: startOfDay(addMonths(selectedDate, 1))
      };
    }
  };

  const { start, end } = getDateRange();

  // Fetch calendar entries
  const { data: entries = [], refetch: refetchEntries } = useQuery({
    queryKey: ['calendar-entries', start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_entries')
        .select('*')
        .gte('start_time', start.toISOString())
        .lt('end_time', end.toISOString());
        
      if (error) throw error;
      return data || [];
    }
  });

  // Setup realtime subscription for calendar entries
  useEffect(() => {
    const channel = supabase
      .channel('calendar-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_entries'
        },
        () => {
          refetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchEntries]);

  // Handle appointment creation/update
  const handleSaveAppointment = async (appointmentData: Partial<CalendarEntry>) => {
    try {
      if (appointmentData.id) {
        // Update existing appointment
        const { error } = await supabase
          .from('calendar_entries')
          .update(appointmentData)
          .eq('id', appointmentData.id);
          
        if (error) throw error;
        
        toast.success('Appointment updated successfully');
      } else {
        // Create new appointment - ensure all required fields are present
        if (!appointmentData.stylist_id || !appointmentData.start_time || !appointmentData.end_time || !appointmentData.title) {
          throw new Error('Missing required fields for appointment creation');
        }
        
        // Insert as a single object, not an array
        const { error } = await supabase
          .from('calendar_entries')
          .insert({
            stylist_id: appointmentData.stylist_id,
            title: appointmentData.title,
            start_time: appointmentData.start_time,
            end_time: appointmentData.end_time,
            client_name: appointmentData.client_name,
            service_name: appointmentData.service_name,
            description: appointmentData.description,
            status: appointmentData.status || 'confirmed'
          });
          
        if (error) throw error;
        
        toast.success('Appointment created successfully');
      }
      
      // Refetch entries to update the UI
      refetchEntries();
    } catch (error: any) {
      toast.error('Error saving appointment: ' + error.message);
    }
  };

  // Handle slot click (create new appointment)
  const handleSlotClick = (time: Date, stylistId?: string) => {
    setSelectedTime(time);
    setSelectedStylistId(stylistId);
    setSelectedAppointment(undefined);
    setModalMode('create');
    setModalOpen(true);
  };

  // Handle entry click (view/edit appointment)
  const handleEntryClick = (entry: CalendarEntry) => {
    setSelectedAppointment(entry);
    setSelectedTime(parseISO(entry.start_time));
    setModalMode('view');
    setModalOpen(true);
  };

  // If loading, show skeleton
  if (loadingStylists) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
        <div className="h-80 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CalendarHeader />
      
      <div className="grid md:grid-cols-[250px_1fr] gap-4">
        <div>
          <StylistToggle stylists={stylists} />
        </div>
        
        <div className="overflow-x-auto">
          {view === 'day' && (
            <DayView 
              stylists={stylists} 
              entries={entries} 
              onSlotClick={handleSlotClick} 
              onEntryClick={handleEntryClick} 
            />
          )}
          
          {view === 'week' && (
            <WeekView 
              stylists={stylists} 
              entries={entries} 
              onSlotClick={handleSlotClick} 
              onEntryClick={handleEntryClick} 
            />
          )}
          
          {view === 'month' && (
            <MonthView 
              stylists={stylists} 
              entries={entries} 
              onSlotClick={handleSlotClick} 
              onEntryClick={handleEntryClick} 
            />
          )}
        </div>
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
