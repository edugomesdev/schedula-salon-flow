
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import StaffList from '@/components/staff/StaffList';
import AddStaffDialog from '@/components/staff/AddStaffDialog';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useStaffStorage } from '@/hooks/staff/useStaffStorage';
import { useToast } from '@/hooks/use-toast';

export const Staff = () => {
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const { initializeStaffStorage } = useStaffStorage();
  const { toast } = useToast();
  
  useEffect(() => {
    // Initialize the storage bucket when the component mounts
    const setupStorage = async () => {
      const success = await initializeStaffStorage();
      if (!success) {
        toast({
          title: 'Storage Setup Failed',
          description: 'Unable to set up file storage for staff images.',
          variant: 'destructive',
        });
      }
    };
    
    setupStorage();
  }, []);
  
  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('stylists')
      .select('*');
    
    if (error) throw error;
    return data || [];
  };

  const { data: staffList = [], refetch } = useQuery({
    queryKey: ['staffList'],
    queryFn: fetchStaff
  });

  const handleAddSuccess = () => {
    setIsAddStaffOpen(false);
    refetch();
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
        
        <StaffList staffList={staffList} />
        
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
