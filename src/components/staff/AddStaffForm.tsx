
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AddStaffFormValues, useAddStaff } from '@/hooks/staff/useAddStaff';

interface AddStaffFormProps {
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddStaffForm = ({ onOpenChange, onSuccess }: AddStaffFormProps) => {
  const { handleSubmit: onSubmit, isLoading } = useAddStaff({
    onOpenChange,
    onSuccess,
  });

  const form = useForm<AddStaffFormValues>({
    defaultValues: {
      name: '',
      bio: '',
      expertiseStr: '',
    },
  });

  const handleFormSubmit = form.handleSubmit(async (values) => {
    const success = await onSubmit(values);
    if (success) {
      form.reset();
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-4">
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
  );
};

export default AddStaffForm;
