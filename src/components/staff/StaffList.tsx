
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Link2, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleConnectGoogleCalendar = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }
      
      if (!session) {
        console.error("No active session found");
        throw new Error('No active session found. Please log in again.');
      }

      console.log('Sending request to Google Calendar auth endpoint');
      const response = await fetch('https://gusvinsszquyhppemkgq.supabase.co/functions/v1/google-calendar-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ stylistId: staff.id })
      });
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}`);
      }
      
      if (!response.ok) {
        console.error('Response not OK:', response.status, data);
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }
      
      console.log('Response from Google Calendar auth:', data);
      
      if (data.authUrl) {
        // Open in a new tab to prevent navigation issues
        window.open(data.authUrl, '_blank', 'noopener,noreferrer');
        
        toast({
          title: 'Google Calendar Authorization',
          description: 'A new window has been opened. Please complete the authorization process there.',
          duration: 8000
        });
      } else {
        throw new Error('No auth URL received from server');
      }
    } catch (error: any) {
      console.error('Google Calendar Connection Error:', error);
      const errorMessage = error.message || 'Failed to connect Google Calendar';
      
      let userFriendlyMessage = errorMessage;
      
      // Check for common errors and provide more helpful messages
      if (errorMessage.includes('requested path is invalid')) {
        userFriendlyMessage = 'The redirect URL configuration is invalid. Please check Google Cloud Console settings.';
      } else if (errorMessage.includes('access_denied')) {
        userFriendlyMessage = 'Access was denied. You may need to be added as a test user in the Google Cloud Console.';
      }
      
      setConnectionError(userFriendlyMessage);
      toast({
        title: 'Connection Error',
        description: userFriendlyMessage,
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
        
        {connectionError && (
          <div className="mb-4 p-3 bg-destructive/10 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-destructive mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-destructive">{connectionError}</p>
              <a 
                href="https://console.cloud.google.com/apis/credentials/consent" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 text-blue-500 mt-1 hover:underline"
              >
                Check Google Cloud Settings <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
        
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
