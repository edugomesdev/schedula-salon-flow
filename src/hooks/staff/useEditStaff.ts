
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { WorkingDay } from '@/components/staff/working-hours/types';

export type StaffFormValues = {
  name: string;
  bio?: string;
  expertise?: string;
  profile_image_url?: string;
  workingHours?: WorkingDay[];
};

interface UseEditStaffProps {
  staffId: string;
  salonId?: string | null;
  onSuccess?: () => void;
  onOpenChange: (open: boolean) => void;
}

export const useEditStaff = ({ staffId, salonId, onSuccess, onOpenChange }: UseEditStaffProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadProfileImage = async (file: File, staffId: string): Promise<string | null> => {
    try {
      if (!salonId) {
        throw new Error("Salon ID is missing");
      }

      // Create a unique file name to prevent overwriting
      const fileExt = file.name.split('.').pop();
      const fileName = `${staffId}-${uuidv4()}.${fileExt}`;
      const filePath = `staff-photos/${fileName}`;

      // Upload the file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('salon-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('salon-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading the profile image. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (values: StaffFormValues) => {
    if (!salonId) {
      toast({
        title: "Error",
        description: "Salon ID is missing. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert comma-separated expertise string to array
      const expertiseArray = values.expertise
        ? values.expertise.split(',').map(item => item.trim()).filter(item => item !== '')
        : [];

      // Update staff details
      const { error: staffUpdateError } = await supabase
        .from('stylists')
        .update({
          name: values.name,
          bio: values.bio || null,
          expertise: expertiseArray,
          profile_image_url: values.profile_image_url || null,
        })
        .eq('id', staffId);

      if (staffUpdateError) throw staffUpdateError;

      // Update working hours if provided
      if (values.workingHours && values.workingHours.length > 0) {
        // First delete existing working hours for this stylist
        const { error: deleteError } = await supabase
          .from('working_hours')
          .delete()
          .eq('stylist_id', staffId);

        if (deleteError) throw deleteError;

        // Now insert the new working hours
        const workingHoursToInsert = values.workingHours.map(hours => ({
          stylist_id: staffId,
          day_of_week: hours.day_of_week,
          start_time: hours.start_time,
          end_time: hours.end_time,
          is_day_off: hours.is_day_off,
        }));

        if (workingHoursToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('working_hours')
            .insert(workingHoursToInsert);

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Staff updated",
        description: `${values.name}'s details have been updated successfully.`,
      });

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating staff:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating the staff member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    uploadProfileImage,
  };
};
