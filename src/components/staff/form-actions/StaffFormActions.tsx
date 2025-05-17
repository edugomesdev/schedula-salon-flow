import { Button } from '@/components/ui/button';
// import { Loader2 } from 'lucide-react'; // Removed unused import (Source 1171)

interface StaffFormActionsProps {
  isSubmitting: boolean;
  isUploading: boolean;
  onCancel: () => void;
}

const StaffFormActions = ({ isSubmitting, isUploading, onCancel }: StaffFormActionsProps) => {
  const showSpinner = isSubmitting || isUploading;
  const buttonText = isSubmitting ? "Saving..." : (isUploading ? "Uploading..." : "Save Changes");

  return (
    <div className="sticky bottom-0 pt-4 mt-6 bg-background border-t flex justify-end space-x-2">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={showSpinner}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={showSpinner}
      >
        {/* If you want a spinner, you'd add <Loader2 className="mr-2 h-4 w-4 animate-spin" /> here */}
        {/* For now, only text changes based on state */}
        {buttonText}
      </Button>
    </div>
  );
};

export default StaffFormActions;
