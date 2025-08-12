
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Edit3, X, Instagram, Linkedin, Github } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface EditSocialLinksDialogProps {
  currentTwitter: string;
  currentInstagram: string;
  currentLinkedin: string;
  currentGithub: string;
  profileId: string;
  onSocialLinksUpdated: () => void;
}

const EditSocialLinksDialog = ({
  currentTwitter,
  currentInstagram,
  currentLinkedin,
  currentGithub,
  profileId,
  onSocialLinksUpdated
}: EditSocialLinksDialogProps) => {
  const [open, setOpen] = useState(false);
  const [twitter, setTwitter] = useState(currentTwitter);
  const [instagram, setInstagram] = useState(currentInstagram);
  const [linkedin, setLinkedin] = useState(currentLinkedin);
  const [github, setGithub] = useState(currentGithub);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          twitter_url: twitter.trim() || null,
          instagram_url: instagram.trim() || null,
          linkedin_url: linkedin.trim() || null,
          github_url: github.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) {
        toast({
          title: "Error updating social links",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Social links updated",
        description: "Your social media links have been updated successfully"
      });

      setOpen(false);
      onSocialLinksUpdated();
    } catch (error) {
      console.error('Error updating social links:', error);
      toast({
        title: "Error updating social links",
        description: "Failed to update your social media links",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Social Links</DialogTitle>
          <DialogDescription>
            Add your social media profiles. Leave blank to hide a link.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="twitter" className="text-right flex items-center gap-1">
              <X className="h-4 w-4" />
              X
            </Label>
            <Input
              id="twitter"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://x.com/username"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="instagram" className="text-right flex items-center gap-1">
              <Instagram className="h-4 w-4" />
              IG
            </Label>
            <Input
              id="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/username"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="linkedin" className="text-right flex items-center gap-1">
              <Linkedin className="h-4 w-4" />
              LI
            </Label>
            <Input
              id="linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="github" className="text-right flex items-center gap-1">
              <Github className="h-4 w-4" />
              GH
            </Label>
            <Input
              id="github"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/username"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSocialLinksDialog;
