
import { useState, useEffect } from 'react';
import { Image, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useFormContext } from 'react-hook-form';

interface ProfileImageUploadProps {
  initialImageUrl?: string | null;
  staffName: string;
  isUploading: boolean;
  isSubmitting: boolean;
  onImageChange: (file: File | null) => void;
}

const ProfileImageUpload = ({
  initialImageUrl,
  staffName,
  isUploading,
  isSubmitting,
  onImageChange,
}: ProfileImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const { register } = useFormContext();

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
      
      onImageChange(file);
      
      // Create preview URL
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
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
    <div className="flex flex-col items-center mb-6">
      <div className="mb-2 relative">
        <Avatar className="h-24 w-24">
          {previewUrl ? (
            <AvatarImage 
              src={previewUrl} 
              alt={staffName} 
              onError={() => {
                console.error('Image failed to load:', previewUrl);
                setPreviewUrl(null);
              }} 
            />
          ) : (
            <AvatarFallback className="text-2xl">
              {staffName.charAt(0)}
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
        {...register('profile_image_url')}
      />
    </div>
  );
};

export default ProfileImageUpload;
