
import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stylist } from '@/types/calendar';
import { FormValues } from './AppointmentTypes';

interface AppointmentFormProps {
  form: UseFormReturn<FormValues>;
  onSubmit: (data: FormValues) => void;
  onClose: () => void;
  stylists: Stylist[];
}

const AppointmentForm = ({ form, onSubmit, onClose, stylists }: AppointmentFormProps) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            {...register('title', { required: 'Title is required' })}
          />
          {errors.title && (
            <p className="text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="client_name">Client Name</Label>
          <Input
            id="client_name"
            {...register('client_name')}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="service_name">Service</Label>
          <Input
            id="service_name"
            {...register('service_name')}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="stylist">Stylist</Label>
          <Select 
            onValueChange={(value) => setValue('stylist_id', value)} 
            defaultValue={watch('stylist_id')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select stylist" />
            </SelectTrigger>
            <SelectContent>
              {stylists.map(stylist => (
                <SelectItem key={stylist.id} value={stylist.id}>
                  <div className="flex items-center gap-2">
                    <span>{stylist.name}</span>
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: stylist.color || '#CBD5E0' }}
                    ></div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Select 
            onValueChange={(value) => setValue('duration', parseInt(value))} 
            defaultValue={watch('duration').toString()}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="description">Notes</Label>
          <Textarea
            id="description"
            {...register('description')}
            rows={3}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  );
};

export default AppointmentForm;
