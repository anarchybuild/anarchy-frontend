
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface EditDescriptionDialogProps {
  currentDescription: string;
  profileId: string;
  onDescriptionUpdated: () => void;
}

const EditDescriptionDialog = ({ currentDescription, profileId, onDescriptionUpdated }: EditDescriptionDialogProps) => {
  const [description, setDescription] = useState(currentDescription);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (description === currentDescription) {
      setOpen(false);
      return;
    }

    if (description.length > 256) {
      toast({
        title: "Description too long",
        description: "Description must be 256 characters or less.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ description: description })
        .eq('id', profileId);

      if (updateError) {
        console.error('Error updating description:', updateError);
        throw updateError;
      }

      toast({
        title: "Description updated",
        description: "Your description has been updated successfully!"
      });

      setOpen(false);
      onDescriptionUpdated();
    } catch (error) {
      console.error('Error updating description:', error);
      toast({
        title: "Error",
        description: "Failed to update description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Pencil size={12} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Description</DialogTitle>
          <DialogDescription>
            Add a description to tell others about yourself.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell others about yourself..."
              maxLength={256}
              disabled={loading}
              autoFocus
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/256 characters
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || description === currentDescription}>
              {loading ? 'Updating...' : 'Update Description'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDescriptionDialog;
