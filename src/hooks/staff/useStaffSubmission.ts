
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WorkingDay } from '@/components/staff/working-hours/types';

export interface StaffFormValues {
  name: string;
  bio?: string;
  expertise?: string;
  profile_image_url?: string;
  workingHours?: WorkingDay[];
}

interface UseStaffSubmissionProps {
  staffId: string;
  salonId?: string | null;
  onSuccess?: () => void;
  onOpenChange: (open: boolean) => void;
}

export const useStaffSubmission = ({ 
  staffId, 
  salonId, 
  onSuccess, 
  onOpenChange 
}: UseStaffSubmissionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitStaffData = async (values: StaffFormValues) => {
    if (!salonId) {
      toast({
        title: "Error",
        description: "Salon ID is missing. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log('Starting staff update process for staff ID:', staffId);

    try {
      // Convert comma-separated expertise string to array
      const expertiseArray = values.expertise
        ? values.expertise.split(',').map(item => item.trim()).filter(item => item !== '')
        : [];

      console.log('Prepared expertise array:', expertiseArray);
      console.log('Profile image URL to save:', values.profile_image_url);

      // Update staff details
      const updateData: any = {
        name: values.name,
        bio: values.bio || null,
        expertise: expertiseArray,
      };
      
      // Only include profile_image_url if it exists
      if (values.profile_image_url) {
        updateData.profile_image_url = values.profile_image_url;
      }

      console.log('Updating staff record with data:', updateData);
      
      const { error: staffUpdateError } = await supabase
        .from('stylists')
        .update(updateData)
        .eq('id', staffId);

      if (staffUpdateError) {
        console.error('Error updating staff record:', staffUpdateError);
        throw staffUpdateError;
      }

      console.log('Staff record updated successfully');

      // Update working hours if provided
      if (values.workingHours && values.workingHours.length > 0) {
        await updateWorkingHours(staffId, values.workingHours);
      }

      toast({
        title: "Staff updated",
        description: `${values.name}'s details have been updated successfully.`,
      });

      if (onSuccess) {
        console.log('Calling onSuccess callback');
        onSuccess();
      }
      
      onOpenChange(false);
      return true;
    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating the staff member. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to update working hours
  const updateWorkingHours = async (staffId: string, workingHours: WorkingDay[]) => {
    console.log('Starting working hours update');
    
    // First delete existing working hours for this stylist
    const { error: deleteError } = await supabase
      .from('working_hours')
      .delete()
      .eq('stylist_id', staffId);

    if (deleteError) {
      console.error('Error deleting existing working hours:', deleteError);
      throw deleteError;
    }

    // Now insert the new working hours
    const workingHoursToInsert = workingHours.map(hours => ({
      stylist_id: staffId,
      day_of_week: hours.day_of_week,
      start_time: hours.start_time,
      end_time: hours.end_time,
      is_day_off: hours.is_day_off,
    }));

    if (workingHoursToInsert.length > 0) {
      console.log('Inserting new working hours:', workingHoursToInsert);
      
      const { error: insertError } = await supabase
        .from('working_hours')
        .insert(workingHoursToInsert);

      if (insertError) {
        console.error('Error inserting working hours:', insertError);
        throw insertError;
      }
      
      console.log('Working hours updated successfully');
    }
  };

  return {
    submitStaffData,
    isSubmitting
  };
};
