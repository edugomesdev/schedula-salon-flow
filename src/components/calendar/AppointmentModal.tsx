import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useForm } from 'react-hook-form';
import { Check, X, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarEntry, Stylist } from '@/types/calendar';
import { isOutsideWorkingHours, formatAppointmentTime } from '@/utils/calendarUtils';
import { Badge } from '@/components/ui/badge';

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<CalendarEntry>) => void;
  appointment?: CalendarEntry;
  startTime?: Date;
  stylists: Stylist[];
  selectedStylistId?: string;
  mode: 'create' | 'edit' | 'view';
}

interface FormValues {
  title: string;
  client_name: string;
  service_name: string;
  description: string;
  stylist_id: string;
  duration: number;
}

const AppointmentModal = ({
  open,
  onClose,
  onSave,
  appointment,
  startTime,
  stylists,
  selectedStylistId,
  mode
}: AppointmentModalProps) => {
  const [showWarning, setShowWarning] = useState(false);
  
  // Setup form with default values
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      title: appointment?.title || '',
      client_name: appointment?.client_name || '',
      service_name: appointment?.service_name || '',
      description: appointment?.description || '',
      stylist_id: appointment?.stylist_id || selectedStylistId || (stylists.length > 0 ? stylists[0].id : ''),
      duration: 60 // Default to 1 hour
    }
  });

  // Check if time is outside working hours
  const isOutsideHours = startTime ? isOutsideWorkingHours(startTime) : false;
  
  // Get selected stylist for color
  const selectedStylistId2 = watch('stylist_id');
  const selectedStylist = stylists.find(s => s.id === selectedStylistId2);
  
  // Create end time based on start time and duration
  const getEndTime = (start: Date, durationMinutes: number) => {
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationMinutes);
    return end;
  };
  
  const onSubmit = (data: FormValues) => {
    // If outside working hours but user hasn't confirmed, show warning
    if (isOutsideHours && !showWarning) {
      setShowWarning(true);
      return;
    }
    
    // Otherwise proceed with save
    const currentTime = startTime || new Date();
    const endTime = getEndTime(currentTime, data.duration);
    
    const appointmentData: Partial<CalendarEntry> = {
      ...data,
      id: appointment?.id,
      start_time: currentTime.toISOString(),
      end_time: endTime.toISOString(),
      status: appointment?.status || 'confirmed'
    };
    
    onSave(appointmentData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Appointment' : 
             mode === 'edit' ? 'Edit Appointment' : 'Appointment Details'}
          </DialogTitle>
          <DialogDescription>
            {startTime && (
              <span>
                {format(startTime, 'EEEE, MMMM d, yyyy')} at {format(startTime, 'h:mm a')}
              </span>
            )}
            {appointment && (
              <span>
                {formatAppointmentTime(appointment.start_time, appointment.end_time)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isOutsideHours && showWarning && (
          <div className="bg-yellow-50 p-3 rounded-md mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <p className="text-sm text-yellow-700">
              This appointment is outside regular working hours. Are you sure you want to continue?
            </p>
          </div>
        )}
        
        {mode === 'view' ? (
          <div className="space-y-4">
            {appointment && (
              <>
                <div>
                  <Label className="text-sm text-gray-500">Title</Label>
                  <p className="font-medium">{appointment.title}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-500">Time</Label>
                  <p>{formatAppointmentTime(appointment.start_time, appointment.end_time)}</p>
                </div>
                
                {appointment.client_name && (
                  <div>
                    <Label className="text-sm text-gray-500">Client</Label>
                    <p>{appointment.client_name}</p>
                  </div>
                )}
                
                {appointment.service_name && (
                  <div>
                    <Label className="text-sm text-gray-500">Service</Label>
                    <p>{appointment.service_name}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm text-gray-500">Stylist</Label>
                  <div className="flex items-center gap-2">
                    <p>{stylists.find(s => s.id === appointment.stylist_id)?.name || 'Unknown'}</p>
                    {selectedStylist && (
                      <Badge style={{ backgroundColor: selectedStylist.color || '#CBD5E0' }}>
                        &nbsp;
                      </Badge>
                    )}
                  </div>
                </div>
                
                {appointment.description && (
                  <div>
                    <Label className="text-sm text-gray-500">Notes</Label>
                    <p className="text-sm">{appointment.description}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm text-gray-500">Status</Label>
                  <Badge className="mt-1" variant={appointment.status === 'confirmed' ? 'default' : 'outline'}>
                    {appointment.status}
                  </Badge>
                </div>
              </>
            )}
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
              {mode !== 'view' && (
                <Button onClick={() => setValue('mode', 'edit' as any)}>Edit</Button>
              )}
            </DialogFooter>
          </div>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentModal;
