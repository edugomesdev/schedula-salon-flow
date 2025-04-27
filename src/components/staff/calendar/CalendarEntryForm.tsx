
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CalendarEntryFormProps {
  stylistId: string;
  selectedDate: Date;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormValues {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

export const CalendarEntryForm = ({ 
  stylistId, 
  selectedDate, 
  onSuccess, 
  onCancel 
}: CalendarEntryFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const form = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00'
    }
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const startDateTime = new Date(`${dateStr}T${values.startTime}`);
      const endDateTime = new Date(`${dateStr}T${values.endTime}`);

      const { error } = await supabase
        .from('calendar_entries')
        .insert({
          stylist_id: stylistId,
          title: values.title,
          description: values.description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Calendar entry added successfully',
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error adding calendar entry:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter event title" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter event description" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Entry'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
