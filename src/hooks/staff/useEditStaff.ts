
import { useStaffImageUpload } from './useStaffImageUpload';
import { useStaffSubmission, StaffFormValues } from './useStaffSubmission';

interface UseEditStaffProps {
  staffId: string;
  salonId?: string | null;
  onSuccess?: () => void;
  onOpenChange: (open: boolean) => void;
}

export type { StaffFormValues } from './useStaffSubmission';

export const useEditStaff = (props: UseEditStaffProps) => {
  const { uploadProfileImage, isUploading, uploadProgress } = useStaffImageUpload(props.salonId);
  const { submitStaffData, isSubmitting } = useStaffSubmission(props);

  /**
   * Handles form submission with improved error handling and validation
   */
  const handleSubmit = async (values: StaffFormValues) => {
    return await submitStaffData(values);
  };

  return {
    handleSubmit,
    isSubmitting,
    isUploading,
    uploadProgress,
    uploadProfileImage,
  };
};
