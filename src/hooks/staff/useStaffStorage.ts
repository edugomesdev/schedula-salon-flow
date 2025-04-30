
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useStaffStorage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the bucket exists and is accessible
    const checkBucket = async () => {
      if (isInitializing || isInitialized) return;
      
      try {
        setIsInitializing(true);
        
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

  const initializeStaffStorage = async () => {
    if (isInitialized) return true;
    
    try {
      // Try to list objects in the bucket to check if it exists and is accessible
      const { error } = await supabase
        .storage
        .from('salon-media')
        .list('staff-photos', { limit: 1 });
      
      if (!error) {
        setIsInitialized(true);
        return true;
      }
      
      console.error('Error accessing storage bucket:', error);
      toast({
        title: 'Storage Access Failed',
        description: 'Unable to access storage for staff images. Please ensure the salon-media bucket exists.',
        variant: 'destructive',
      });
      
      return false;
    } catch (error) {
      console.error('Error initializing staff storage:', error);
      return false;
    }
  };

  return {
    initializeStaffStorage,
    isInitialized,
    isInitializing
  };
};
