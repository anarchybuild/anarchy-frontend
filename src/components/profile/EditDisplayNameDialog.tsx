
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { validateDisplayName } from '@/utils/displayNameValidation';

interface EditDisplayNameDialogProps {
  currentDisplayName: string;
  profileId: string;
  onDisplayNameUpdated: () => void;
}

const EditDisplayNameDialog = ({ currentDisplayName, profileId, onDisplayNameUpdated }: EditDisplayNameDialogProps) => {
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('EditDisplayNameDialog: Starting display name update process');
    console.log('Current display name:', currentDisplayName);
    console.log('New display name:', displayName);
    console.log('Profile ID:', profileId);
    
    if (displayName === currentDisplayName) {
      console.log('Display name unchanged, closing dialog');
      setOpen(false);
      return;
    }

    const validation = validateDisplayName(displayName);
    if (!validation.isValid) {
      console.log('Display name validation failed:', validation.error);
      toast({
        title: "Invalid display name",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Updating display name for profile ID:', profileId);
      
      // Update the profile using the profile ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          display_name: displayName.trim() || null
        })
        .eq('id', profileId);

      if (updateError) {
        console.error('Error updating display name:', updateError);
        throw updateError;
      }

      console.log('Display name updated successfully');
      toast({
        title: "Display name updated",
        description: "Your display name has been updated successfully!"
      });

      setOpen(false);
      onDisplayNameUpdated();
    } catch (error) {
      console.error('Error updating display name:', error);
      toast({
        title: "Error",
        description: "Failed to update display name. Please try again.",
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
          <DialogTitle>Edit Display Name</DialogTitle>
          <DialogDescription>
            Change your display name. This is how your name appears to other users alongside your username.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-display-name">Display Name</Label>
            <Input
              id="edit-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Display Name"
              maxLength={15}
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Up to 15 characters. Letters, numbers, and underscores only. Leave empty to show only username.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || displayName === currentDisplayName}>
              {loading ? 'Updating...' : 'Update Display Name'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDisplayNameDialog;
