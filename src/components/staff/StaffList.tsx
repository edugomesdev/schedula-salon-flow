import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StaffMember {
  id: string;
  name: string;
  bio?: string;
  profile_image_url?: string;
  expertise?: string[]; // This might not exist in the actual database
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
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectGoogleCalendar = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch(`${supabase.functions.getUrl('google-calendar-auth')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stylistId: staff.id })
      });
      
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Google Calendar Connection Error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect Google Calendar',
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const defaultExpertise = ['Haircut', 'Styling'];
  const expertise = staff.expertise || defaultExpertise;
  
  return (
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
        
        <div className="space-y-2 mt-4">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleConnectGoogleCalendar}
            disabled={isConnecting}
          >
            <Link2 className="mr-2 h-4 w-4" />
            {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
          </Button>
          
          <Button variant="outline" className="w-full" asChild>
            <a href={`/dashboard/staff/${staff.id}`}>
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffList;
