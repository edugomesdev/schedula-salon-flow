
import { useState, useEffect } from 'react';
import { format } from 'date-fns'; // Removed 'parseISO' as it was unused (Source 770)
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { CalendarEntry, Stylist } from '@/types/calendar';
import { isOutsideWorkingHours, formatAppointmentTime } from '@/utils/calendarUtils';
import AppointmentView from './appointment/AppointmentView';
import AppointmentForm from './appointment/AppointmentForm';
import AppointmentWarning from './appointment/AppointmentWarning';
import { FormValues } from './appointment/AppointmentTypes';

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<CalendarEntry>) => void;
  appointment?: CalendarEntry;
  startTime?: Date;
  stylists: Stylist[];
  selectedStylistId?: string;
  mode: 'create' | 'edit' | 'view';
}

const AppointmentModal = ({
  open,
  onClose,
  onSave,
  appointment,
  startTime,
  stylists,
  selectedStylistId,
  mode
}: AppointmentModalProps) => {
  const [showWarning, setShowWarning] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);

  // Debug log when modal state changes
  console.log('[AppointmentModal] State:', { // [✓] Source 772
    open,
    mode,
    currentMode,
    appointmentId: appointment?.id,
    startTime: startTime?.toString(),
    selectedStylistId
  });

  // Reset mode when appointment or mode props change
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode, appointment]);

  // Setup form with default values
  const form = useForm<FormValues>({
    defaultValues: {
      title: appointment?.title || '',
      client_name: appointment?.client_name || '',
      service_name: appointment?.service_name || '',
      description: appointment?.description || '',
      stylist_id: appointment?.stylist_id || selectedStylistId || (stylists.length > 0 ? stylists[0].id : ''),
      duration: 60 // Default to 1 hour
    }
  });

  // Reset form when appointment changes, with debug
  useEffect(() => {
    console.log('[AppointmentModal] Resetting form with:', { appointment, selectedStylistId }); // [✓] Source 775
    if (appointment) {
      form.reset({
        title: appointment.title,
        client_name: appointment.client_name || '',
        service_name: appointment.service_name || '',
        description: appointment.description || '',
        stylist_id: appointment.stylist_id,
        // Calculate duration if possible, otherwise default
        duration: (appointment.start_time && appointment.end_time)
          ? (new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / (60 * 1000)
          : 60
      });
    } else {
      form.reset({
        title: '',
        client_name: '',
        service_name: '',
        description: '',
        stylist_id: selectedStylistId || (stylists.length > 0 ? stylists[0].id : ''),
        duration: 60
      });
    }
  }, [appointment, selectedStylistId, stylists, form]);

  // Check if time is outside working hours
  const isOutsideHours = startTime ? isOutsideWorkingHours(startTime) : false; // [✓] Source 777

  // Create end time based on start time and duration
  const getEndTime = (start: Date, durationMinutes: number) => {
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationMinutes);
    return end;
  };

  const onSubmit = (data: FormValues) => {
    console.log('[AppointmentModal] Form submitted with data:', data); // [✓] Source 780
    // If outside working hours but user hasn't confirmed, show warning
    if (isOutsideHours && !showWarning) {
      setShowWarning(true);
      return;
    }

    // Otherwise proceed with save
    const currentTime = startTime || (appointment ? new Date(appointment.start_time) : new Date());
    const endTimeValue = getEndTime(currentTime, data.duration);

    const appointmentData: Partial<CalendarEntry> = {
      ...data, // Spreads title, client_name, service_name, description, stylist_id, duration
      id: appointment?.id, // Preserve id if editing
      start_time: currentTime.toISOString(),
      end_time: endTimeValue.toISOString(),
      status: appointment?.status || 'confirmed' // Preserve status or default to confirmed
    };
    console.log('Saving appointment data:', appointmentData); // [✓] Source 781
    onSave(appointmentData);
  };

  // Handle dialog state change manually to debug
  const handleOpenChange = (openState: boolean) => { // Renamed open to openState to avoid conflict
    console.log(`[AppointmentModal] Dialog open state changed to: ${openState}`); // [✓] Source 782
    if (!openState) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentMode === 'create' ? 'Create Appointment' :
              currentMode === 'edit' ? 'Edit Appointment' : 'Appointment Details'}
          </DialogTitle>
          <DialogDescription>
            {startTime && !appointment && ( // Show start time only if creating new and startTime is provided
              <span>
                {format(startTime, 'EEEE, MMMM d, yyyy')} at {format(startTime, 'h:mm a')}
              </span>
            )}
            {appointment && ( // Show existing appointment time if viewing/editing
              <span>
                {formatAppointmentTime(appointment.start_time, appointment.end_time)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isOutsideHours && showWarning && currentMode !== 'view' && (
          <AppointmentWarning
            message="This appointment is outside regular working hours. Are you sure you want to continue?"
          />
        )}

        {currentMode === 'view' && appointment ? (
          <AppointmentView
            appointment={appointment}
            stylists={stylists}
            onClose={onClose}
            onEdit={() => setCurrentMode('edit')}
            mode={mode} // Pass original mode for view logic
          />
        ) : (
          <AppointmentForm
            form={form}
            onSubmit={onSubmit}
            onClose={onClose}
            stylists={stylists}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentModal;
