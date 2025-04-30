
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface StaffFormActionsProps {
  isSubmitting: boolean;
  isUploading: boolean;
  onCancel: () => void;
}

const StaffFormActions = ({ isSubmitting, isUploading, onCancel }: StaffFormActionsProps) => {
  return (
    <div className="sticky bottom-0 pt-4 mt-6 bg-background border-t flex justify-end space-x-2">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting || isUploading}
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting || isUploading}
      >
        {isSubmitting ? "Saving..." : (isUploading ? "Uploading..." : "Save Changes")}
      </Button>
    </div>
  );
};

export default StaffFormActions;
