import { useState } from 'react';
import { format, parseISO } from 'date-fns';
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

  // Check if time is outside working hours
  const isOutsideHours = startTime ? isOutsideWorkingHours(startTime) : false;
  
  // Create end time based on start time and duration
  const getEndTime = (start: Date, durationMinutes: number) => {
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationMinutes);
    return end;
  };
  
  const onSubmit = (data: FormValues) => {
    // If outside working hours but user hasn't confirmed, show warning
    if (isOutsideHours && !showWarning) {
      setShowWarning(true);
      return;
    }
    
    // Otherwise proceed with save
    const currentTime = startTime || new Date();
    const endTime = getEndTime(currentTime, data.duration);
    
    const appointmentData: Partial<CalendarEntry> = {
      ...data,
      id: appointment?.id,
      start_time: currentTime.toISOString(),
      end_time: endTime.toISOString(),
      status: appointment?.status || 'confirmed'
    };
    
    onSave(appointmentData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentMode === 'create' ? 'Create Appointment' : 
             currentMode === 'edit' ? 'Edit Appointment' : 'Appointment Details'}
          </DialogTitle>
          <DialogDescription>
            {startTime && (
              <span>
                {format(startTime, 'EEEE, MMMM d, yyyy')} at {format(startTime, 'h:mm a')}
              </span>
            )}
            {appointment && (
              <span>
                {formatAppointmentTime(appointment.start_time, appointment.end_time)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isOutsideHours && showWarning && (
          <AppointmentWarning 
            message="This appointment is outside regular working hours. Are you sure you want to continue?" 
          />
        )}
        
        {currentMode === 'view' ? (
          appointment && (
            <AppointmentView
              appointment={appointment}
              stylists={stylists}
              onClose={onClose}
              onEdit={() => setCurrentMode('edit')}
              mode={mode}
            />
          )
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
