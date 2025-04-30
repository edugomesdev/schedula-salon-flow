
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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
import { DialogFooter } from '@/components/ui/dialog';
import { useEditStaff, StaffFormValues } from '@/hooks/staff/useEditStaff';

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bio: z.string().optional(),
  expertise: z.string().optional(),
  profile_image_url: z.string().optional(),
});

interface StaffMember {
  id: string;
  name: string;
  bio?: string;
  profile_image_url?: string;
  expertise?: string[];
}

interface EditStaffFormProps {
  staff: StaffMember;
  salonId?: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditStaffForm = ({ staff, salonId, onOpenChange, onSuccess }: EditStaffFormProps) => {
  const { handleSubmit, isSubmitting } = useEditStaff({
    staffId: staff.id,
    salonId,
    onSuccess,
    onOpenChange,
  });

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: staff.name,
      bio: staff.bio || '',
      expertise: staff.expertise ? staff.expertise.join(', ') : '',
      profile_image_url: staff.profile_image_url || '',
    },
  });

  const onSubmit = (values: StaffFormValues) => {
    handleSubmit(values);
  };

  return (
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
  );
};

export default EditStaffForm;
