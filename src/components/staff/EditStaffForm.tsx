
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { Image, Loader2 } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useEditStaff, StaffFormValues } from '@/hooks/staff/useEditStaff';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import WorkingHoursEditor from './working-hours/WorkingHoursEditor';

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(staff.profile_image_url || null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
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

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUploadError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size
      const maxSizeMB = 5;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setImageUploadError(`File size exceeds ${maxSizeMB}MB limit`);
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setImageUploadError('Invalid file type. Allowed: JPG, PNG, GIF, WEBP');
        return;
      }
      
      setImageFile(file);
      
      // Create preview URL
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      
      // Store the URL in the form
      form.setValue('profile_image_url', fileUrl);
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

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Profile Image Upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-2 relative">
            <Avatar className="h-24 w-24">
              {previewUrl ? (
                <AvatarImage 
                  src={previewUrl} 
                  alt={staff.name} 
                  onError={() => {
                    console.error('Image failed to load:', previewUrl);
                    setPreviewUrl(null);
                  }} 
                />
              ) : (
                <AvatarFallback className="text-2xl">
                  {staff.name.charAt(0)}
                </AvatarFallback>
              )}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </Avatar>
          </div>
          
          <label htmlFor="profile-image" className="cursor-pointer">
            <div className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Image size={16} />
              <span>{previewUrl ? 'Change profile image' : 'Add profile image'}</span>
            </div>
            <input
              id="profile-image"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="hidden"
              disabled={isUploading || isSubmitting}
            />
          </label>
          
          {imageUploadError && (
            <p className="text-sm text-destructive mt-1">{imageUploadError}</p>
          )}
          
          <input 
            type="hidden" 
            {...form.register('profile_image_url')}
          />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter a short bio" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expertise"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expertise (comma separated)</FormLabel>
              <FormControl>
                <Input placeholder="Haircut, Styling, Color" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Working Hours Editor */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Working Hours</h3>
          <WorkingHoursEditor 
            staffId={staff.id} 
            onChange={setWorkingHours} 
          />
        </div>

        {/* Fixed footer with buttons */}
        <div className="sticky bottom-0 pt-4 mt-6 bg-background border-t flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
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
      </form>
    </Form>
  );
};

export default EditStaffForm;
