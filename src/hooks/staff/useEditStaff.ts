
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Uploads a profile image to Supabase storage and returns the public URL
   * Includes comprehensive error handling and logging
   */
  const uploadProfileImage = async (file: File, staffId: string): Promise<string | null> => {
    if (!file) {
      console.log('No file provided for upload');
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      if (!salonId) {
        console.error('Upload failed: Salon ID is missing');
        throw new Error("Salon ID is missing");
      }

      // Validate file before upload
      const maxSizeMB = 5;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      
      if (file.size > maxSizeBytes) {
        console.error(`File size exceeds ${maxSizeMB}MB limit`);
        throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        console.error(`Invalid file type: ${file.type}. Allowed: ${validTypes.join(', ')}`);
        throw new Error(`Invalid file type. Allowed: JPG, PNG, GIF, WEBP`);
      }

      // Create a unique file name to prevent overwriting
      const fileExt = file.name.split('.').pop();
      const fileName = `${staffId}-${uuidv4()}.${fileExt}`;
      const filePath = `staff-photos/${fileName}`;

      console.log(`Starting upload for file: ${fileName} to path: ${filePath}`);
      
      // Upload the file to Supabase Storage with retry logic
      let uploadAttempts = 0;
      const maxAttempts = 3;
      let uploadSuccessful = false;
      let data;
      let uploadError;

      while (!uploadSuccessful && uploadAttempts < maxAttempts) {
        uploadAttempts++;
        console.log(`Upload attempt ${uploadAttempts} of ${maxAttempts}`);
        
        try {
          const { error, data: uploadData } = await supabase.storage
            .from('salon-media')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (error) {
            console.error(`Upload attempt ${uploadAttempts} failed:`, error);
            uploadError = error;
            // Wait before retry
            if (uploadAttempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } else {
            console.log(`Upload successful on attempt ${uploadAttempts}`);
            data = uploadData;
            uploadSuccessful = true;
            setUploadProgress(100);
          }
        } catch (error) {
          console.error(`Exception during upload attempt ${uploadAttempts}:`, error);
          uploadError = error;
          if (uploadAttempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (!uploadSuccessful) {
        throw uploadError || new Error('Upload failed after multiple attempts');
      }

      // Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('salon-media')
        .getPublicUrl(filePath);

      console.log('Image upload successful. Public URL:', publicUrl);
      
      // Verify the URL is valid
      if (!publicUrl || publicUrl.trim() === '') {
        throw new Error('Generated public URL is invalid');
      }

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading the profile image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handles form submission with improved error handling and validation
   */
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
        const workingHoursToInsert = values.workingHours.map(hours => ({
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
    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating the staff member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    isUploading,
    uploadProgress,
    uploadProfileImage,
  };
};
