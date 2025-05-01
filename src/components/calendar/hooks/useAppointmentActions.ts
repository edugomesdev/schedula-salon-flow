
import { useState, useCallback } from 'react';
import { parseISO } from 'date-fns';
import { toast } from 'sonner';
import { supabaseBrowser } from '@/integrations/supabase/browserClient';
import { CalendarEntry } from '@/types/calendar';

interface AppointmentActionsProps {
  refetchEntries: () => void;
}

// Custom hook to handle appointment actions
export const useAppointmentActions = ({ refetchEntries }: AppointmentActionsProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarEntry | undefined>();
  const [selectedTime, setSelectedTime] = useState<Date | undefined>();
  const [selectedStylistId, setSelectedStylistId] = useState<string | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  // Handle slot click (create new appointment) with improved debugging
  const handleSlotClick = useCallback((time: Date, stylistId?: string) => {
    console.log(`[AppointmentActions] handleSlotClick called with time=${time.toISOString()}`, 
      { stylistId, currentModalState: modalOpen });
    
    // Force close and reopen if already open to prevent stale state
    if (modalOpen) {
      setModalOpen(false);
      // Use setTimeout to ensure state updates before reopening
      setTimeout(() => {
        setSelectedTime(time);
        setSelectedStylistId(stylistId);
        setSelectedAppointment(undefined);
        setModalMode('create');
        setModalOpen(true);
        console.log('[AppointmentActions] Modal reopened after forced close');
      }, 10);
    } else {
      setSelectedTime(time);
      setSelectedStylistId(stylistId);
      setSelectedAppointment(undefined);
      setModalMode('create');
      setModalOpen(true);
      console.log('[AppointmentActions] Modal opened normally');
    }
  }, [modalOpen]);

  // Handle entry click (view/edit appointment)
  const handleEntryClick = useCallback((entry: CalendarEntry) => {
    console.log('[AppointmentActions] Entry clicked', entry);
    setSelectedAppointment(entry);
    setSelectedTime(parseISO(entry.start_time));
    setSelectedStylistId(entry.stylist_id);
    setModalMode('view');
    setModalOpen(true);
  }, []);

  // Handle appointment creation/update
  const handleSaveAppointment = async (appointmentData: Partial<CalendarEntry>) => {
    try {
      console.log('[AppointmentActions] Saving appointment data:', appointmentData);
      
      if (appointmentData.id) {
        // Update existing appointment
        const { error } = await supabaseBrowser
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
        const { error } = await supabaseBrowser
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
      
      // Close the modal after successful save
      setModalOpen(false);
    } catch (error: any) {
      console.error('[AppointmentActions] Error saving appointment:', error);
      toast.error('Error saving appointment: ' + error.message);
    }
  };

  return {
    modalOpen,
    setModalOpen,
    selectedAppointment,
    selectedTime,
    selectedStylistId,
    modalMode,
    handleSlotClick,
    handleEntryClick,
    handleSaveAppointment
  };
};
