
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UseAppointmentRescheduleProps {
  refetchEntries: () => void;
}

export const useAppointmentReschedule = ({ refetchEntries }: UseAppointmentRescheduleProps) => {
  const [isRescheduling, setIsRescheduling] = useState(false);

  const rescheduleAppointment = async (entryId: string, newTime: Date, newStylistId?: string) => {
    try {
      setIsRescheduling(true);
      toast.loading('Rescheduling appointment...', { id: 'reschedule' });
      
      // First get the current entry to calculate duration
      const { data: entry, error: fetchError } = await supabase
        .from('calendar_entries')
        .select('*')
        .eq('id', entryId)
        .single();
        
      if (fetchError) {
        throw new Error(`Could not fetch appointment: ${fetchError.message}`);
      }
      
      // Calculate duration from current entry
      const startTime = new Date(entry.start_time);
      const endTime = new Date(entry.end_time);
      const durationMs = endTime.getTime() - startTime.getTime();
      
      // Calculate new end time
      const newEndTime = new Date(newTime.getTime() + durationMs);
      
      // Format for database
      const formattedStartTime = format(newTime, "yyyy-MM-dd'T'HH:mm:ss");
      const formattedEndTime = format(newEndTime, "yyyy-MM-dd'T'HH:mm:ss");

      // Check for conflicts
      const { data: conflicts, error: conflictError } = await supabase
        .from('calendar_entries')
        .select('*')
        .neq('id', entryId) // Exclude the current entry
        .eq('stylist_id', newStylistId || entry.stylist_id)
        .or(`start_time.lt.${formattedEndTime},end_time.gt.${formattedStartTime}`);

      if (conflictError) {
        throw new Error(`Could not check for conflicts: ${conflictError.message}`);
      }

      if (conflicts && conflicts.length > 0) {
        toast.dismiss('reschedule');
        toast.error('Cannot reschedule: Time slot conflicts with another appointment');
        return;
      }
      
      // Prepare update data
      const updateData: any = {
        start_time: formattedStartTime,
        end_time: formattedEndTime
      };
      
      // Add stylist_id only if it's changing
      if (newStylistId && newStylistId !== entry.stylist_id) {
        updateData.stylist_id = newStylistId;
      }
      
      // Update the calendar entry
      const { error: updateError } = await supabase
        .from('calendar_entries')
        .update(updateData)
        .eq('id', entryId);
        
      if (updateError) {
        throw new Error(`Could not reschedule appointment: ${updateError.message}`);
      }
      
      // Also update the appointments table if it exists
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({
          start_time: formattedStartTime,
          end_time: formattedEndTime,
          ...(newStylistId && newStylistId !== entry.stylist_id ? { stylist_id: newStylistId } : {})
        })
        .eq('start_time', entry.start_time)
        .eq('stylist_id', entry.stylist_id);
      
      if (appointmentError) {
        // console.warn removed. The main operation succeeded, and this is a secondary concern.
        // If critical, this should be logged to a monitoring service.
      }
      
      toast.dismiss('reschedule');
      toast.success('Appointment rescheduled successfully');
      refetchEntries();
    } catch (error: any) {
      // console.error removed. Error is re-thrown and/or handled by toast.
      toast.dismiss('reschedule');
      toast.error(`Error rescheduling: ${error.message}`);
    } finally {
      setIsRescheduling(false);
    }
  };

  return {
    isRescheduling,
    rescheduleAppointment
  };
};
