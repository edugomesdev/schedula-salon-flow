
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
      <DialogContent className="sm:max-w-[600px] h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Edit Staff Member</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full max-h-[calc(90vh-140px)]">
            <div className="p-6 pt-4">
              <EditStaffForm 
                staff={staff} 
                salonId={salonId} 
                onOpenChange={onOpenChange} 
                onSuccess={onSuccess} 
              />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditStaffDialog;
