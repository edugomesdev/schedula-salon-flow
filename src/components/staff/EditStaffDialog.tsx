
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useSalon } from '@/hooks/dashboard/useSalon';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bio: z.string().optional(),
  expertise: z.string().optional(),
  profile_image_url: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface StaffMember {
  id: string;
  name: string;
  bio?: string;
  profile_image_url?: string;
  expertise?: string[];
}

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
  onSuccess?: () => void;
}

const EditStaffDialog = ({ open, onOpenChange, staff, onSuccess }: EditStaffDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { salonId } = useSalon();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: staff.name,
      bio: staff.bio || '',
      expertise: staff.expertise ? staff.expertise.join(', ') : '',
      profile_image_url: staff.profile_image_url || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!salonId) {
      toast({
        title: "Error",
        description: "Salon ID is missing. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert comma-separated expertise string to array
      const expertiseArray = values.expertise
        ? values.expertise.split(',').map(item => item.trim()).filter(item => item !== '')
        : [];

      const { error } = await supabase
        .from('stylists')
        .update({
          name: values.name,
          bio: values.bio || null,
          expertise: expertiseArray,
          profile_image_url: values.profile_image_url || null,
        })
        .eq('id', staff.id);

      if (error) throw error;

      toast({
        title: "Staff updated",
        description: `${values.name}'s details have been updated successfully.`,
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating staff:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating the staff member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
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
                    <Input placeholder="Name" {...field} />
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
                    <Textarea placeholder="Enter a short bio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expertise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expertise (comma separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="Haircut, Styling, Color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profile_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStaffDialog;
