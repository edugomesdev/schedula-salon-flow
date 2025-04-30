
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Form } from '@/components/ui/form';
import { useEditStaff, StaffFormValues } from '@/hooks/staff/useEditStaff';
import WorkingHoursEditor from './working-hours/WorkingHoursEditor';
import ProfileImageUpload from './profile-image/ProfileImageUpload';
import StaffFormFields from './form-fields/StaffFormFields';
import StaffFormActions from './form-actions/StaffFormActions';

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bio: z.string().optional(),
  expertise: z.string().optional(),
  profile_image_url: z.string().optional(),
});

interface StaffMember {
  id: string;
  name: string;
  bio?: string;
  profile_image_url?: string;
  expertise?: string[];
}

interface EditStaffFormProps {
  staff: StaffMember;
  salonId?: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditStaffForm = ({ staff, salonId, onOpenChange, onSuccess }: EditStaffFormProps) => {
  const { handleSubmit, isSubmitting, uploadProfileImage, isUploading } = useEditStaff({
    staffId: staff.id,
    salonId,
    onSuccess,
    onOpenChange,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  
  // Create a form instance with react-hook-form
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: staff.name,
      bio: staff.bio || '',
      expertise: staff.expertise ? staff.expertise.join(', ') : '',
      profile_image_url: staff.profile_image_url || '',
    },
  });

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      form.setValue('profile_image_url', URL.createObjectURL(file));
    }
  };

  // Submit handler
  const onSubmit = async (values: StaffFormValues) => {
    try {
      console.log('Form values before submission:', values);
      let imageUrl = staff.profile_image_url;
      
      // If there's a new image, upload it first
      if (imageFile) {
        console.log('New image detected, uploading...');
        imageUrl = await uploadProfileImage(imageFile, staff.id);
        
        if (!imageUrl) {
          console.error('Image upload failed or returned null URL');
          return; // Stop submission if image upload failed
        }
        
        console.log('Image uploaded successfully, URL:', imageUrl);
        
        // Update the form value with the new URL
        form.setValue('profile_image_url', imageUrl);
        values.profile_image_url = imageUrl;
      }
      
      // Add the image URL and working hours to the form values
      const updatedValues = {
        ...values,
        profile_image_url: imageUrl,
        workingHours,
      };
      
      console.log('Final submission values:', updatedValues);
      
      // Submit the form
      await handleSubmit(updatedValues);
    } catch (error) {
      console.error('Error in form submission:', error);
      // Error is already handled in handleSubmit
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Profile Image Upload component */}
        <ProfileImageUpload
          initialImageUrl={staff.profile_image_url}
          staffName={staff.name}
          isUploading={isUploading}
          isSubmitting={isSubmitting}
          onImageChange={handleImageChange}
        />

        {/* Form fields */}
        <StaffFormFields />

        {/* Working Hours Editor */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Working Hours</h3>
          <WorkingHoursEditor 
            staffId={staff.id} 
            onChange={setWorkingHours} 
          />
        </div>

        {/* Form actions */}
        <StaffFormActions
          isSubmitting={isSubmitting}
          isUploading={isUploading}
          onCancel={() => onOpenChange(false)}
        />
      </form>
    </Form>
  );
};

export default EditStaffForm;
