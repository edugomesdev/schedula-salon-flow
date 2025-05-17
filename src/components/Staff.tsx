import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // [✓] Source 1179
import { supabase } from '@/lib/supabaseClient'; // [✓] Source 1179
import DashboardLayout from '@/components/layouts/DashboardLayout'; // [✓] Source 1179
import StaffList from '@/components/staff/StaffList'; // [✓] Source 1180
import AddStaffDialog from '@/components/staff/AddStaffDialog'; // [✓] Source 1180
import { Button } from '@/components/ui/button'; // [✓] Source 1180
import { UserPlus } from 'lucide-react'; // [✓] Source 1181
import { useStaffStorage } from '@/hooks/staff/useStaffStorage'; // [✓] Source 1181

// Define the type for a staff member based on its usage and typical database structure
interface StaffMember {
  id: string;
  name: string;
  bio?: string | null; // Allow null for bio
  profile_image_url?: string | null; // Allow null
  expertise?: string[] | null; // Allow null for expertise array
  // Add other fields if they exist in your 'professionals' table
}


export const Staff = () => {
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const { initializeStaffStorage } = useStaffStorage();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize the storage bucket when the component mounts
    const setupStorage = async () => {
      console.log('Setting up storage for staff photos'); // [✓] Source 1182
      await initializeStaffStorage();
    };
    setupStorage();
  }, [initializeStaffStorage]); // Added initializeStaffStorage to dependency array

  const fetchStaff = async (): Promise<StaffMember[]> => { // Added return type
    console.log('Fetching staff list'); // [✓] Source 1184
    const { data, error } = await supabase
      .from('stylists') // Changed from 'professionals' to 'stylists' based on other files
      .select('*');

    if (error) {
      console.error('Error fetching staff:', error); // [✓] Source 1185
      throw error;
    }
    console.log(`Fetched ${data?.length || 0} staff members`); // [✓] Source 1186
    return (data as StaffMember[]) || []; // Cast to StaffMember[]
  };

  // Removed 'refetch' as it was unused (Source 1187)
  const { data: staffList = [], isLoading } = useQuery<StaffMember[], Error>({
    queryKey: ['staffList'],
    queryFn: fetchStaff
  });

  const handleAddSuccess = () => {
    console.log('Staff added successfully, refreshing list'); // [✓] Source 1188
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
