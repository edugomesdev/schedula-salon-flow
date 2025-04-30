
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormValues {
  name: string;
  bio: string;
  expertiseStr: string;
}

const AddStaffDialog = ({ open, onOpenChange, onSuccess }: AddStaffDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      bio: '',
      expertiseStr: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
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
      if (newStylist) {
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
        }
      }

      toast({
        title: 'Success',
        description: 'Staff member added successfully',
      });
      
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter staff member name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter staff member bio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expertiseStr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expertise (comma-separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Haircut, Coloring, Styling"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Staff Member'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStaffDialog;
