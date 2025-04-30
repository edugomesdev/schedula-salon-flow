
import { supabase } from '@/integrations/supabase/client';

export const useStaffStorage = () => {
  const initializeStaffStorage = async () => {
    try {
      // Check if the salon-media bucket exists
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketsError) {
        throw bucketsError;
      }
      
      // If the bucket doesn't exist, create it
      const bucketExists = buckets.some(bucket => bucket.name === 'salon-media');
      
      if (!bucketExists) {
        const { error } = await supabase
          .storage
          .createBucket('salon-media', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
          });
          
        if (error) {
          throw error;
        }
        
        console.log('Created salon-media storage bucket');
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing staff storage:', error);
      return false;
    }
  };

  return {
    initializeStaffStorage,
  };
};
