
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface AddStaffFormValues {
  name: string;
  bio: string;
  expertiseStr: string;
}

interface UseAddStaffProps {
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const useAddStaff = ({ onOpenChange, onSuccess }: UseAddStaffProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (values: AddStaffFormValues) => {
    setIsLoading(true);
    try {
      // Ensure user is authenticated
      if (!user) {
        throw new Error('You must be logged in to add staff members');
      }

      // Get expertise as array from comma-separated string
      const expertiseArray = values.expertiseStr
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
      
      // Get the first salon owned by the user or create a default salon if none exists
      let salonId;
      
      const { data: existingSalons } = await supabase
        .from('salons')
        .select('id')
        .limit(1);

      if (existingSalons && existingSalons.length > 0) {
        salonId = existingSalons[0].id;
      } else {
        // Create a default salon if none exists
        const { data: newSalon, error: salonError } = await supabase
          .from('salons')
          .insert({
            name: 'My Salon',
            owner_id: user.id
          })
          .select('id')
          .single();

        if (salonError) throw salonError;
        salonId = newSalon.id;
      }
      
      // Insert into stylists table with the expertise array
      const { data: newStylist, error } = await supabase.from('stylists')
        .insert({
          name: values.name,
          bio: values.bio,
          salon_id: salonId,
          expertise: expertiseArray
        })
        .select('id, name')
        .single();

      if (error) throw error;

      // Create initial calendar entry for the new stylist
      let calendarCreated = false;
      if (newStylist) {
        console.log(`Creating initial calendar entry for new stylist: ${newStylist.name} (${newStylist.id})`);
        
        // Get current date for initial calendar setup
        const today = new Date();
        const startTime = new Date(today);
        startTime.setHours(9, 0, 0, 0); // Default start at 9 AM
        
        const endTime = new Date(today);
        endTime.setHours(10, 0, 0, 0); // Default end at 10 AM
        
        // Create a welcome calendar entry
        const { error: calendarError } = await supabase
          .from('calendar_entries')
          .insert({
            stylist_id: newStylist.id,
            title: `Welcome ${newStylist.name}`,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            description: 'Welcome to your new calendar!',
            status: 'confirmed'
          });
          
        if (calendarError) {
          console.error('Error creating initial calendar entry:', calendarError);
          // We don't throw here as the staff was created successfully
          toast({
            title: 'Note',
            description: 'Staff added, but there was an issue setting up their calendar.',
          });
        } else {
          calendarCreated = true;
          console.log(`Calendar entry created successfully for stylist: ${newStylist.id}`);
        }
      }

      // Success message with a link to view the calendar if it was created
      if (calendarCreated && newStylist) {
        toast({
          title: 'Success',
          description: (
            <div className="space-y-2">
              <p>Staff member added successfully</p>
              <a 
                href={`/dashboard/appointments?stylistId=${newStylist.id}`}
                className="text-primary underline hover:text-primary/80 block mt-1"
              >
                View their calendar
              </a>
            </div>
          ),
        });
      } else {
        toast({
          title: 'Success',
          description: 'Staff member added successfully',
        });
      }
      
      onSuccess();
      onOpenChange(false);
      return true;
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSubmit,
    isLoading
  };
};
