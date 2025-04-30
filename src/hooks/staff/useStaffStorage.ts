
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useStaffStorage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [bucketExists, setBucketExists] = useState(false);
  const { toast } = useToast();

  // Check if the bucket exists and is accessible on component mount
  useEffect(() => {
    const checkBucket = async () => {
      if (isInitializing || isInitialized) return;
      
      try {
        setIsInitializing(true);
        console.log('Checking if salon-media bucket exists');
        
        // Try to list buckets to check if the salon-media bucket exists
        const { data: buckets, error: bucketsError } = await supabase
          .storage
          .listBuckets();
        
        if (bucketsError) {
          console.error('Error listing storage buckets:', bucketsError);
          return false;
        }
        
        const mediaBucket = buckets?.find(bucket => bucket.name === 'salon-media');
        
        if (!mediaBucket) {
          console.log('salon-media bucket not found');
          setBucketExists(false);
          return false;
        }
        
        console.log('salon-media bucket found, checking accessibility');
        setBucketExists(true);
        
        // Try to list objects in the bucket to check if it's accessible
        const { error } = await supabase
          .storage
          .from('salon-media')
          .list('staff-photos', { limit: 1 });
        
        if (error) {
          console.error('Error accessing storage bucket:', error);
          toast({
            title: 'Storage Access Failed',
            description: 'Unable to access storage for staff images.',
            variant: 'destructive',
          });
          return false;
        }
        
        console.log('salon-media bucket is accessible');
        setIsInitialized(true);
        return true;
      } catch (error) {
        console.error('Error initializing staff storage:', error);
        return false;
      } finally {
        setIsInitializing(false);
      }
    };
    
    checkBucket();
  }, [toast, isInitializing, isInitialized]);

  /**
   * Function to initialize the staff storage bucket
   * This will be called if the bucket doesn't exist or isn't accessible
   */
  const initializeStaffStorage = async () => {
    if (isInitialized) {
      console.log('Staff storage already initialized');
      return true;
    }
    
    try {
      console.log('Initializing staff storage');
      setIsInitializing(true);
      
      if (!bucketExists) {
        console.log('salon-media bucket does not exist, but we should not create it in code');
        toast({
          title: 'Storage Setup Required',
          description: 'The salon-media bucket needs to be created by an admin.',
          variant: 'destructive',
        });
        return false;
      }
      
      // Try to list objects in the bucket to check if it's accessible
      const { error } = await supabase
        .storage
        .from('salon-media')
        .list('staff-photos', { limit: 1 });
      
      if (error) {
        console.error('Error accessing storage bucket:', error);
        toast({
          title: 'Storage Access Failed',
          description: 'Unable to access storage for staff images. Please ensure the salon-media bucket exists and has proper permissions.',
          variant: 'destructive',
        });
        return false;
      }
      
      console.log('Staff storage initialized successfully');
      setIsInitialized(true);
      return true;
    } catch (error) {
      console.error('Error initializing staff storage:', error);
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  return {
    initializeStaffStorage,
    isInitialized,
    isInitializing,
    bucketExists
  };
};
