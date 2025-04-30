
import { useSalon } from '@/hooks/dashboard/useSalon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EditStaffForm from './EditStaffForm';

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
  const { salonId } = useSalon();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
        </DialogHeader>

        <EditStaffForm 
          staff={staff} 
          salonId={salonId} 
          onOpenChange={onOpenChange} 
          onSuccess={onSuccess} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditStaffDialog;
