
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export const useStaffImageUpload = (salonId?: string | null) => {
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Uploads a profile image to Supabase storage and returns the public URL
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

  return {
    uploadProfileImage,
    isUploading,
    uploadProgress
  };
};
