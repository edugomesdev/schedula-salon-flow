
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, PencilLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import EditStaffDialog from './EditStaffDialog';

interface StaffMember {
  id: string;
  name: string;
  bio?: string;
  profile_image_url?: string;
  expertise?: string[];
}

interface StaffListProps {
  staffList: StaffMember[];
}

const StaffList = ({ staffList }: StaffListProps) => {
  if (!staffList.length) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No staff members found. Add your first staff member to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {staffList.map((staff) => (
        <StaffCard key={staff.id} staff={staff} />
      ))}
    </div>
  );
};

const StaffCard = ({ staff }: { staff: StaffMember }) => {
  const [localStaff, setLocalStaff] = useState<StaffMember>(staff);
  const [rating] = useState(Math.floor(Math.random() * 5) + 1);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // This key is used to force the Avatar component to re-render
  const [imageKey, setImageKey] = useState<string>(Date.now().toString());

  const defaultExpertise = ['Haircut', 'Styling'];
  const expertise = localStaff.expertise || defaultExpertise;
  
  // Function to fetch the latest staff data
  const refreshStaffData = async () => {
    try {
      const { data, error } = await supabase
        .from('stylists')
        .select('*')
        .eq('id', staff.id)
        .single();
      
      if (error) throw error;
      if (data) {
        console.log('Updated staff data:', data);
        setLocalStaff(data);
        // Force re-render of avatar image
        setImageKey(Date.now().toString());
      }
    } catch (error) {
      console.error('Error refreshing staff data:', error);
    }
  };
  
  const handleEditSuccess = async () => {
    setIsEditStaffOpen(false);
    
    toast({
      title: "Staff updated",
      description: `${localStaff.name}'s details have been updated successfully.`,
    });
    
    // Refresh the staff data
    await refreshStaffData();
    
    // Invalidate queries to refresh the staff list
    queryClient.invalidateQueries({ queryKey: ['staffList'] });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10" key={imageKey}>
                {localStaff.profile_image_url ? (
                  <AvatarImage 
                    src={`${localStaff.profile_image_url}?t=${imageKey}`} 
                    alt={localStaff.name} 
                    onError={(e) => {
                      console.error('Error loading avatar image:', e);
                      // Fall back to initials
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <AvatarFallback className="text-primary-foreground bg-primary">
                    {localStaff.name.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <CardTitle className="text-xl">{localStaff.name}</CardTitle>
            </div>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <span 
                  key={i} 
                  className={`text-xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-1">{localStaff.bio || 'No bio available'}</div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Expertise</h4>
            <div className="flex flex-wrap gap-2">
              {expertise.length ? (
                expertise.map((skill, index) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No expertise listed</span>
              )}
            </div>
          </div>
          
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" asChild>
              <Link to={`/dashboard/appointments?stylistId=${localStaff.id}`}>
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsEditStaffOpen(true)}
              aria-label="Edit staff member"
            >
              <PencilLine className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isEditStaffOpen && (
        <EditStaffDialog
          open={isEditStaffOpen}
          onOpenChange={setIsEditStaffOpen}
          staff={localStaff}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export default StaffList;
