
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Camera } from 'lucide-react';
import { validateImageFile, createFilePreview } from '@/utils/fileValidation';
import { uploadAvatar, removeAvatar } from '@/services/avatarService';
import AvatarPreview from './AvatarPreview';
import AvatarFileInput from './AvatarFileInput';
import CircularImageCropper from './CircularImageCropper';

interface EditAvatarDialogProps {
  currentAvatarUrl: string | null;
  profileId: string;
  onAvatarUpdated: () => void;
}

const EditAvatarDialog = ({ currentAvatarUrl, profileId, onAvatarUpdated }: EditAvatarDialogProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    try {
      const preview = await createFilePreview(file);
      setPreviewUrl(preview);
      setShowCropper(true);
      setCroppedBlob(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create file preview",
        variant: "destructive"
      });
    }
  };

  const handleCropComplete = (blob: Blob) => {
    setCroppedBlob(blob);
    setShowCropper(false);
  };

  const handleBackToCropper = () => {
    setShowCropper(true);
  };

  const handleUpload = async () => {
    if (!croppedBlob) {
      toast({
        title: "No image cropped",
        description: "Please crop your image first",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    // Convert blob to file
    const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
    
    const result = await uploadAvatar(file, profileId);
    
    if (result.success) {
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated"
      });

      setOpen(false);
      setPreviewUrl(null);
      setCroppedBlob(null);
      setShowCropper(false);
      onAvatarUpdated();
    } else {
      toast({
        title: "Upload failed",
        description: result.error,
        variant: "destructive"
      });
    }
    
    setUploading(false);
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    
    const result = await removeAvatar(profileId);
    
    if (result.success) {
      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed"
      });

      setOpen(false);
      setPreviewUrl(null);
      setCroppedBlob(null);
      setShowCropper(false);
      onAvatarUpdated();
    } else {
      toast({
        title: "Failed to remove",
        description: result.error,
        variant: "destructive"
      });
    }
    
    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-0 right-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8 p-0"
        >
          <Camera className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
          <DialogDescription>
            Upload a new profile picture or remove your current one.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!previewUrl && (
            <AvatarFileInput onFileSelect={handleFileSelect} disabled={uploading} />
          )}
          
          {previewUrl && showCropper && (
            <CircularImageCropper
              imageUrl={previewUrl}
              onCropComplete={handleCropComplete}
              size={300}
            />
          )}
          
          {previewUrl && !showCropper && croppedBlob && (
            <div className="space-y-4">
              <AvatarPreview previewUrl={URL.createObjectURL(croppedBlob)} />
              <Button
                variant="outline"
                onClick={handleBackToCropper}
                className="w-full"
                disabled={uploading}
              >
                Edit Crop
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {currentAvatarUrl && (
            <Button
              variant="destructive"
              onClick={handleRemoveAvatar}
              disabled={uploading}
            >
              Remove
            </Button>
          )}
          <Button
            onClick={handleUpload}
            disabled={uploading || !croppedBlob}
          >
            {uploading ? 'Uploading...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAvatarDialog;
