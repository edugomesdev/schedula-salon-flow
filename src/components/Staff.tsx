
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import StaffList from '@/components/staff/StaffList';
import AddStaffDialog from '@/components/staff/AddStaffDialog';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useStaffStorage } from '@/hooks/staff/useStaffStorage';

export const Staff = () => {
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const { initializeStaffStorage } = useStaffStorage();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Initialize the storage bucket when the component mounts
    const setupStorage = async () => {
      console.log('Setting up storage for staff photos');
      await initializeStaffStorage();
      // No toast warnings needed, we assume storage is properly configured
    };
    
    setupStorage();
  }, []);
  
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

  const { data: staffList = [], refetch, isLoading } = useQuery({
    queryKey: ['staffList'],
    queryFn: fetchStaff
  });

  const handleAddSuccess = () => {
    console.log('Staff added successfully, refreshing list');
    setIsAddStaffOpen(false);
    
    // Invalidate the staffList query to refetch data
    queryClient.invalidateQueries({ queryKey: ['staffList'] });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <Button 
            onClick={() => setIsAddStaffOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus size={18} />
            Add Staff
          </Button>
        </div>
        
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
