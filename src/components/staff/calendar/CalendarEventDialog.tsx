
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarEntryForm } from './CalendarEntryForm';
import { CalendarEvent } from '@/types/calendar';

interface CalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEvent: CalendarEvent | null;
  selectedStaffId: string;
  selectedDate: Date;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CalendarEventDialog = ({
  open,
  onOpenChange,
  selectedEvent,
  selectedStaffId,
  selectedDate,
  onSuccess,
  onCancel
}: CalendarEventDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedEvent?.status === 'booked' ? 'Edit Calendar Entry' : 'Add Calendar Entry'}
          </DialogTitle>
        </DialogHeader>
        <CalendarEntryForm
          stylistId={selectedEvent?.stylistId || selectedStaffId}
          selectedDate={selectedDate}
          startTime={selectedEvent?.startTime}
          endTime={selectedEvent?.endTime}
          clientName={selectedEvent?.clientName}
          serviceName={selectedEvent?.serviceName}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
};
