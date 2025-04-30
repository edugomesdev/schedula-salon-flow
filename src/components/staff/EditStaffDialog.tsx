
import { useSalon } from '@/hooks/dashboard/useSalon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EditStaffForm from './EditStaffForm';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const { salon } = useSalon();
  const salonId = salon?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-100px)] pr-4">
          <EditStaffForm 
            staff={staff} 
            salonId={salonId} 
            onOpenChange={onOpenChange} 
            onSuccess={onSuccess} 
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EditStaffDialog;
