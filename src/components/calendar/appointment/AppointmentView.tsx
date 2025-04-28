
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { CalendarEntry, Stylist } from '@/types/calendar';
import { formatAppointmentTime } from '@/utils/calendarUtils';

interface AppointmentViewProps {
  appointment: CalendarEntry;
  stylists: Stylist[];
  onClose: () => void;
  onEdit: () => void;
  mode: 'create' | 'edit' | 'view';
}

const AppointmentView = ({ appointment, stylists, onClose, onEdit, mode }: AppointmentViewProps) => {
  const selectedStylist = stylists.find(s => s.id === appointment.stylist_id);

  return (
    <div className="space-y-4">
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
      
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>Close</Button>
        {mode !== 'view' && (
          <Button onClick={onEdit}>Edit</Button>
        )}
      </DialogFooter>
    </div>
  );
};

export default AppointmentView;
