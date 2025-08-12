
interface AvatarPreviewProps {
  previewUrl: string;
}

const AvatarPreview = ({ previewUrl }: AvatarPreviewProps) => {
  return (
    <div className="flex justify-center">
      <img 
        src={previewUrl} 
        alt="Preview" 
        className="h-32 w-32 rounded-full object-cover border"
      />
    </div>
  );
};

export default AvatarPreview;
