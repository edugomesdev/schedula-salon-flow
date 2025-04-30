
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type StaffFormValues = {
  name: string;
  bio?: string;
  expertise?: string;
  profile_image_url?: string;
};

interface UseEditStaffProps {
  staffId: string;
  salonId?: string | null;
  onSuccess?: () => void;
  onOpenChange: (open: boolean) => void;
}

export const useEditStaff = ({ staffId, salonId, onSuccess, onOpenChange }: UseEditStaffProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: StaffFormValues) => {
    if (!salonId) {
      toast({
        title: "Error",
        description: "Salon ID is missing. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert comma-separated expertise string to array
      const expertiseArray = values.expertise
        ? values.expertise.split(',').map(item => item.trim()).filter(item => item !== '')
        : [];

      const { error } = await supabase
        .from('stylists')
        .update({
          name: values.name,
          bio: values.bio || null,
          expertise: expertiseArray,
          profile_image_url: values.profile_image_url || null,
        })
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: "Staff updated",
        description: `${values.name}'s details have been updated successfully.`,
      });

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating staff:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating the staff member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
  };
};
