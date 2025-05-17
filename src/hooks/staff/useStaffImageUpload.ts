import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export const useStaffImageUpload = (salonId?: string | null) => {
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0); // Retained for potential future use
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
    setUploadProgress(0); // Reset progress

    try {
      if (!salonId) {
        console.error('Upload failed: Salon ID is missing');
        toast({ title: "Error", description: "Salon ID is missing for image upload.", variant: "destructive" });
        return null;
      }

      // Validate file before upload
      const maxSizeMB = 5;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        const errorMsg = `File size exceeds ${maxSizeMB}MB limit`;
        console.error(errorMsg);
        toast({ title: "Upload Failed", description: errorMsg, variant: "destructive" });
        return null;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        const errorMsg = `Invalid file type: ${file.type}. Allowed: ${validTypes.join(', ')}`;
        console.error(errorMsg);
        toast({ title: "Upload Failed", description: errorMsg, variant: "destructive" });
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${staffId}-${uuidv4()}.${fileExt}`;
      // It's good practice to ensure the salonId is part of the path for organization if multiple salons might use the same bucket
      // Or ensure staffId is globally unique enough. Assuming staff-photos is a general bucket.
      const filePath = `staff-photos/${fileName}`;
      console.log(`Starting upload for file: ${fileName} to path: ${filePath}`);

      let uploadAttempts = 0;
      const maxAttempts = 3;
      let uploadSuccessful = false;
      // let data; // 'data' (from uploadData) was unused (Source 1059)
      let uploadError: Error | null = null; // Explicitly type uploadError

      while (!uploadSuccessful && uploadAttempts < maxAttempts) {
        uploadAttempts++;
        console.log(`Upload attempt ${uploadAttempts} of ${maxAttempts}`);
        try {
          // The uploadData from supabase.storage.from().upload() contains { data: { path: string }, error }
          // We only need to check for error here. The path is filePath.
          const { error } = await supabase.storage // Removed data: uploadData destructuring
            .from('salon-media') // Bucket name (Source 1060)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false // Set to true if you want to overwrite, false to error if exists (uuid should make it unique)
            });

          if (error) {
            console.error(`Upload attempt ${uploadAttempts} failed:`, error);
            uploadError = error;
            if (uploadAttempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts)); // Exponential backoff
            }
          } else {
            console.log(`Upload successful on attempt ${uploadAttempts}`);
            uploadSuccessful = true;
            setUploadProgress(100); // Indicate completion
          }
        } catch (errorCatched: any) { // Catch any unexpected error during the attempt
          console.error(`Exception during upload attempt ${uploadAttempts}:`, errorCatched);
          uploadError = errorCatched instanceof Error ? errorCatched : new Error(String(errorCatched));
          if (uploadAttempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
          }
        }
      }

      if (!uploadSuccessful) {
        throw uploadError || new Error('Upload failed after multiple attempts');
      }

      const { data: publicUrlData } = supabase.storage // Renamed data to publicUrlData for clarity
        .from('salon-media')
        .getPublicUrl(filePath);

      console.log('Image upload successful. Public URL data:', publicUrlData); // [✓] Source 1062

      if (!publicUrlData?.publicUrl || publicUrlData.publicUrl.trim() === '') {
        throw new Error('Generated public URL is invalid or empty');
      }
      return publicUrlData.publicUrl;

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
