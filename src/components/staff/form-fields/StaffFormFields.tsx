
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFormContext } from 'react-hook-form';
import { StaffFormValues } from '@/hooks/staff/useEditStaff';

const StaffFormFields = () => {
  const { control } = useFormContext<StaffFormValues>();

  return (
    <>
      <FormField
        control={control}
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
        control={control}
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
        control={control}
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
    </>
  );
};

export default StaffFormFields;
