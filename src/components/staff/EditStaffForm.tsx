import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { Image } from 'lucide-react';

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
import { DialogFooter } from '@/components/ui/dialog';
import { useEditStaff, StaffFormValues } from '@/hooks/staff/useEditStaff';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import WorkingHoursEditor from './working-hours/WorkingHoursEditor';

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bio: z.string().optional(),
  expertise: z.string().optional(),
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
  const { handleSubmit, isSubmitting, uploadProfileImage } = useEditStaff({
    staffId: staff.id,
    salonId,
    onSuccess,
    onOpenChange,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(staff.profile_image_url || null);
  const [workingHours, setWorkingHours] = useState<any[]>([]);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: staff.name,
      bio: staff.bio || '',
      expertise: staff.expertise ? staff.expertise.join(', ') : '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview URL
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  const onSubmit = async (values: StaffFormValues) => {
    let imageUrl = staff.profile_image_url;
    
    // If there's a new image, upload it first
    if (imageFile) {
      imageUrl = await uploadProfileImage(imageFile, staff.id);
    }
    
    // Add the image URL to the form values
    const updatedValues = {
      ...values,
      profile_image_url: imageUrl,
      workingHours,
    };
    
    handleSubmit(updatedValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Profile Image Upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-2">
            <Avatar className="h-24 w-24">
              {previewUrl ? (
                <AvatarImage src={previewUrl} alt={staff.name} />
              ) : (
                <AvatarFallback className="text-2xl">
                  {staff.name.charAt(0)}
                </AvatarFallback>
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
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
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

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default EditStaffForm;
