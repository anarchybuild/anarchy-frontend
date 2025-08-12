
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { validateUsername } from '@/utils/usernameValidation';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/hooks/useQuery';

interface EditUsernameDialogProps {
  currentUsername: string;
  profileId: string;
  walletAddress: string;
  onUsernameUpdated: () => void;
}

const EditUsernameDialog = ({ currentUsername, profileId, walletAddress, onUsernameUpdated }: EditUsernameDialogProps) => {
  const [username, setUsername] = useState(currentUsername);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('EditUsernameDialog: Starting username update process');
    console.log('Current username:', currentUsername);
    console.log('New username:', username);
    console.log('Profile ID:', profileId);
    console.log('Wallet address:', walletAddress);
    
    // Check current auth state
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔐 Current auth session:', session?.user?.id || 'No session');
    
    if (username === currentUsername) {
      console.log('Username unchanged, closing dialog');
      setOpen(false);
      return;
    }

    const validation = validateUsername(username);
    if (!validation.isValid) {
      console.log('Username validation failed:', validation.error);
      toast({
        title: "Invalid username",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Checking if username is available...');
      
      // Check if username is available (exclude current profile)
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', profileId);

      if (checkError) {
        console.error('Error checking username availability:', checkError);
        throw checkError;
      }

      if (existingUsers && existingUsers.length > 0) {
        console.log('Username already taken by another user');
        toast({
          title: "Username taken",
          description: "This username is already taken. Please choose another.",
          variant: "destructive"
        });
        return;
      }

      console.log('Username is available, updating profile with ID:', profileId);
      
      // Update the profile using the profile ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          username: username,
          username_set: true 
        })
        .eq('id', profileId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }

      console.log('Username updated successfully');
      
      // Invalidate and refetch profile data to show updated username immediately
      await queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.profile(walletAddress) 
      });
      await queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.profileById(profileId) 
      });
      
      toast({
        title: "Username updated",
        description: "Your username has been updated successfully!"
      });

      setOpen(false);
      onUsernameUpdated();
    } catch (error) {
      console.error('Error updating username:', error);
      toast({
        title: "Error",
        description: "Failed to update username. Please try again.",
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
          <DialogTitle>Edit Username</DialogTitle>
          <DialogDescription>
            Change your username. This will update how you appear to other users.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-username">Username</Label>
            <Input
              id="edit-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="your_username"
              maxLength={15}
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Up to 15 characters. Letters, numbers, and underscores only.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !username || username === currentUsername}>
              {loading ? 'Updating...' : 'Update Username'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUsernameDialog;
