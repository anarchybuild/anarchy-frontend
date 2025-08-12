
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface EditWebsiteDialogProps {
  currentWebsite: string;
  profileId: string;
  onWebsiteUpdated: () => void;
}

const EditWebsiteDialog = ({ currentWebsite, profileId, onWebsiteUpdated }: EditWebsiteDialogProps) => {
  const [website, setWebsite] = useState(currentWebsite);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (website === currentWebsite) {
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ website: website })
        .eq('id', profileId);

      if (updateError) {
        console.error('Error updating website:', updateError);
        throw updateError;
      }

      toast({
        title: "Website updated",
        description: "Your website has been updated successfully!"
      });

      setOpen(false);
      onWebsiteUpdated();
    } catch (error) {
      console.error('Error updating website:', error);
      toast({
        title: "Error",
        description: "Failed to update website. Please try again.",
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
          <DialogTitle>Edit Website</DialogTitle>
          <DialogDescription>
            Add your website URL to share your portfolio or personal site.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-website">Website</Label>
            <Input
              id="edit-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g. myportfolio.com"
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || website === currentWebsite}>
              {loading ? 'Updating...' : 'Update Website'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditWebsiteDialog;
