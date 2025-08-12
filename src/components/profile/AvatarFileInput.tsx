
import { Button } from '@/components/ui/button';

interface AvatarFileInputProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

const AvatarFileInput = ({ onFileSelect, disabled }: AvatarFileInputProps) => {
  return (
    <div>
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={() => document.getElementById('avatar-upload')?.click()}
        className="w-full"
        disabled={disabled}
      >
        Select Image
      </Button>
    </div>
  );
};

export default AvatarFileInput;
