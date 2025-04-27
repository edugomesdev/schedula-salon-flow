
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import StaffCalendar from '@/components/staff/StaffCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Avatar } from '@/components/ui/avatar';

interface StaffMember {
  id: string;
  name: string;
  bio?: string;
  profile_image_url?: string;
  expertise?: string[];
}

const StaffCalendarPage = () => {
  const { id } = useParams<{ id: string }>();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchStaffMember = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('stylists')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        setStaff(data);
      } catch (error: any) {
        console.error('Error fetching staff member:', error);
        toast({
          title: 'Error',
          description: `Failed to load staff member: ${error.message}`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStaffMember();
  }, [id, toast]);
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!staff) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <p>Staff member not found</p>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              {staff.profile_image_url ? (
                <img 
                  src={staff.profile_image_url} 
                  alt={staff.name} 
                />
              ) : (
                <div className="bg-primary text-primary-foreground flex items-center justify-center h-full w-full rounded-full text-xl">
                  {staff.name.charAt(0)}
                </div>
              )}
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{staff.name}</CardTitle>
              {staff.bio && (
                <p className="text-muted-foreground">{staff.bio}</p>
              )}
              {staff.expertise && staff.expertise.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {staff.expertise.map((skill, index) => (
                    <span key={index} className="text-xs bg-secondary px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <StaffCalendar staffId={id || ''} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffCalendarPage;
