
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  imagePreview: string | null;
  onImageChange: (file: File | null) => void;
}

const ImageUploader = ({ imagePreview, onImageChange }: ImageUploaderProps) => {
  const { toast } = useToast();
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, or GIF).",
        variant: "destructive"
      });
      return;
    }

    // Create a preview URL and pass the file to parent
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageChange(file);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <Label>Upload Image</Label>
      <Card className="mt-2 border-dashed border-2 relative h-[300px]">
        <input 
          type="file" 
          id="image" 
          accept="image/jpeg,image/png,image/gif" 
          onChange={handleImageChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          {imagePreview ? 
            <img src={imagePreview} alt="Design Preview" className="max-h-full max-w-full object-contain" /> 
            : 
            <div className="text-center">
              <div className="border-2 border-dashed border-muted rounded-full p-4 inline-flex mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to upload<br />
                JPEG, PNG, or GIF. Max 50MB.
              </p>
            </div>
          }
        </div>
      </Card>
      
      {imagePreview && 
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="mt-2" 
          onClick={() => onImageChange(null)}
        >
          Remove Image
        </Button>
      }
    </div>
  );
};

export default ImageUploader;
