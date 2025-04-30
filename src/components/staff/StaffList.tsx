
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
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
  const [rating] = useState(Math.floor(Math.random() * 5) + 1);
  const { toast } = useToast();
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);

  const defaultExpertise = ['Haircut', 'Styling'];
  const expertise = staff.expertise || defaultExpertise;
  
  const handleEditSuccess = () => {
    setIsEditStaffOpen(false);
    toast({
      title: "Staff updated",
      description: `${staff.name}'s details have been updated successfully.`,
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {staff.profile_image_url ? (
                  <img src={staff.profile_image_url} alt={staff.name} />
                ) : (
                  <div className="bg-primary text-primary-foreground flex items-center justify-center h-full w-full rounded-full">
                    {staff.name.charAt(0)}
                  </div>
                )}
              </Avatar>
              <CardTitle className="text-xl">{staff.name}</CardTitle>
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
          <div className="text-sm text-muted-foreground mt-1">{staff.bio || 'No bio available'}</div>
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
          
          <div className="space-y-2 mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link to={`/dashboard/appointments?stylistId=${staff.id}`}>
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsEditStaffOpen(true)}
            >
              <PencilLine className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isEditStaffOpen && (
        <EditStaffDialog
          open={isEditStaffOpen}
          onOpenChange={setIsEditStaffOpen}
          staff={staff}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export default StaffList;
