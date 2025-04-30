
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useStaffStorage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [bucketExists, setBucketExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if the bucket exists and is accessible on component mount
  useEffect(() => {
    const checkBucket = async () => {
      if (isInitializing || isInitialized) return;
      
      try {
        setIsInitializing(true);
        setIsLoading(true);
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
          setIsLoading(false);
          return false;
        }
        
        console.log('salon-media bucket found, checking accessibility');
        setBucketExists(true);
        
        // Try to list objects in the bucket to check if it's accessible
        const { data, error } = await supabase
          .storage
          .from('salon-media')
          .list('staff-photos', { limit: 1 });
        
        if (error) {
          console.error('Error accessing storage bucket:', error);
          setIsLoading(false);
          return false;
        }
        
        console.log('salon-media bucket is accessible, found items:', data?.length);
        setIsInitialized(true);
        setIsLoading(false);
        return true;
      } catch (error) {
        console.error('Error initializing staff storage:', error);
        setIsLoading(false);
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
      setIsLoading(true);
      
      // Check if the bucket exists
      const { data: buckets } = await supabase
        .storage
        .listBuckets();
      
      const mediaBucket = buckets?.find(bucket => bucket.name === 'salon-media');
      
      if (!mediaBucket) {
        console.log('salon-media bucket does not exist, but we should not create it in code');
        setBucketExists(false);
        setIsLoading(false);
        toast({
          title: 'Storage Setup Required',
          description: 'The salon-media bucket needs to be created by an admin.',
          variant: 'destructive',
        });
        return false;
      }
      
      setBucketExists(true);
      
      // Try to list objects to see if we have access to the bucket
      const { error: listError } = await supabase
        .storage
        .from('salon-media')
        .list('staff-photos', { limit: 1 });
      
      // Try to create the staff-photos folder if it doesn't exist
      if (listError) {
        console.log('Error accessing staff-photos folder, attempting to create it');
        
        // We'll upload a tiny placeholder file to create the folder
        const emptyBlob = new Blob([''], { type: 'text/plain' });
        const file = new File([emptyBlob], '.placeholder', { type: 'text/plain' });
        
        const { error: uploadError } = await supabase
          .storage
          .from('salon-media')
          .upload('staff-photos/.placeholder', file);
        
        if (uploadError) {
          console.error('Error creating staff-photos folder:', uploadError);
          setIsLoading(false);
          toast({
            title: 'Storage Access Failed',
            description: 'Unable to access storage for staff images. Please ensure you have the right permissions.',
            variant: 'destructive',
          });
          return false;
        }
      }
      
      console.log('Staff storage initialized successfully');
      setIsInitialized(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error initializing staff storage:', error);
      setIsLoading(false);
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  return {
    initializeStaffStorage,
    isInitialized,
    isInitializing,
    bucketExists,
    isLoading
  };
};
