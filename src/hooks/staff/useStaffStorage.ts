import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast'; // Keep useToast if you plan to use it for actual errors

export const useStaffStorage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  // const [bucketExists, setBucketExists] = useState(true); // 'bucketExists' was unused (Source 484)
  const { toast } = useToast();

  const initializeStaffStorage = useCallback(async () => {
    if (isInitialized || isInitializing) {
      // console.log('Staff storage initialization already in progress or completed.');
      return true; // Avoid re-initializing if already done or in progress
    }

    console.log('Initializing staff storage: Checking salon-media bucket'); // [✓] Source 488
    setIsInitializing(true);
    let success = false;

    try {
      // Attempt to list a known folder or a single item to check accessibility.
      // Listing with limit: 1 is a lightweight way to check.
      const { error } = await supabase
        .storage
        .from('salon-media') // Bucket name (Source 489)
        .list('staff-photos', { limit: 1 }); // Check a common folder

      if (error) {
        // Log the error, but don't necessarily show a disruptive toast unless it's critical for app function.
        // The original code suppressed this, which might be okay if the bucket is expected to be auto-created by Supabase policies or first upload.
        console.error('Error accessing/verifying "salon-media" storage bucket in "staff-photos" folder:', error.message);
        // If bucket/folder non-existence is a recoverable or expected state (e.g., created on first upload),
        // you might not want to toast here.
        // toast({
        //   title: "Storage Warning",
        //   description: `Could not verify 'staff-photos' folder in 'salon-media' bucket: ${error.message}. Uploads might fail if not configured.`,
        //   variant: "destructive",
        // });
        // Depending on requirements, you might set isInitialized to false or throw
      } else {
        console.log('salon-media bucket and staff-photos folder seem accessible.'); // [✓] Source 490
        setIsInitialized(true);
        success = true;
      }
    } catch (error: any) {
      console.error('Exception during staff storage initialization:', error.message);
      // toast({
      //   title: "Storage Initialization Error",
      //   description: error.message || "An unexpected error occurred.",
      //   variant: "destructive",
      // });
    } finally {
      setIsInitializing(false);
    }
    return success; // Return true if successfully initialized or if errors are non-critical for this check
  }, [isInitialized, isInitializing, toast]); // Added toast to dependencies

  // Optional: Run initialization once on mount if desired
  useEffect(() => {
    // initializeStaffStorage(); // You could call it here if it should run automatically
    // For now, it's on-demand via the returned function.
  }, [initializeStaffStorage]);


  return {
    initializeStaffStorage,
    isInitialized,
    isInitializing,
    // bucketExists: true, // This was always true, effectively making it unused for conditional logic (Source 499)
  };
};
