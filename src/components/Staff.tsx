
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import StaffList from '@/components/staff/StaffList';
import AddStaffDialog from '@/components/staff/AddStaffDialog';
import { Button } from '@/components/ui/button';
import { UserPlus, RefreshCw } from 'lucide-react';
import { useStaffStorage } from '@/hooks/staff/useStaffStorage';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export const Staff = () => {
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const { initializeStaffStorage, bucketExists, isLoading: storageLoading } = useStaffStorage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [retrying, setRetrying] = useState(false);
  
  useEffect(() => {
    // Initialize the storage bucket when the component mounts
    const setupStorage = async () => {
      console.log('Setting up storage for staff photos');
      const success = await initializeStaffStorage();
      
      if (!success && !bucketExists) {
        toast({
          title: 'Storage Setup Required',
          description: 'The image storage system needs to be set up for staff photos.',
          variant: 'destructive',
        });
      } else if (!success) {
        toast({
          title: 'Storage Setup Failed',
          description: 'Unable to set up file storage for staff images. Some features may be limited.',
          variant: 'destructive',
        });
      } else {
        console.log('Storage setup successful');
      }
    };
    
    setupStorage();
  }, [retrying]);
  
  const fetchStaff = async () => {
    console.log('Fetching staff list');
    const { data, error } = await supabase
      .from('stylists')
      .select('*');
    
    if (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} staff members`);
    return data || [];
  };

  const { data: staffList = [], refetch, isLoading: staffLoading } = useQuery({
    queryKey: ['staffList'],
    queryFn: fetchStaff
  });

  const handleAddSuccess = () => {
    console.log('Staff added successfully, refreshing list');
    setIsAddStaffOpen(false);
    
    // Invalidate the staffList query to refetch data
    queryClient.invalidateQueries({ queryKey: ['staffList'] });
  };

  const handleRetry = async () => {
    setRetrying(true);
    await initializeStaffStorage();
    setRetrying(false);
  };

  const isLoading = staffLoading || storageLoading;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <Button 
            onClick={() => setIsAddStaffOpen(true)}
            className="flex items-center gap-2"
            disabled={!bucketExists}
          >
            <UserPlus size={18} />
            Add Staff
          </Button>
        </div>
        
        {!bucketExists && !storageLoading && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Storage Setup Required</AlertTitle>
            <AlertDescription className="flex flex-col gap-4">
              <p>The storage system for staff photos needs to be set up. This typically requires admin privileges.</p>
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  disabled={retrying}
                  className="flex items-center gap-2"
                >
                  {retrying ? 'Retrying...' : 'Retry Connection'}
                  {retrying ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <p className="text-muted-foreground">Loading staff members...</p>
          </div>
        ) : (
          <StaffList staffList={staffList} />
        )}
        
        <AddStaffDialog 
          open={isAddStaffOpen} 
          onOpenChange={setIsAddStaffOpen}
          onSuccess={handleAddSuccess}
        />
      </div>
    </DashboardLayout>
  );
};

export default Staff;
