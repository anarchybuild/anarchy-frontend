import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { createCollection } from '@/services/collectionService';
import { Plus } from 'lucide-react';

interface CreateCollectionDialogProps {
  userId: string;
  onCollectionCreated: () => void;
}

const CreateCollectionDialog = ({ userId, onCollectionCreated }: CreateCollectionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your collection",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await createCollection(name, description, userId);
      
      toast({
        title: "Collection created",
        description: "Your new collection has been created successfully"
      });

      setName('');
      setDescription('');
      setOpen(false);
      onCollectionCreated();
    } catch (error) {
      console.error('Error creating collection:', error);
      toast({
        title: "Error creating collection",
        description: "Failed to create your collection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-full min-h-[200px] border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 bg-muted/50 hover:bg-muted">
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-8 w-8 text-muted-foreground" />
            <span className="text-muted-foreground">Create New Collection</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Create a new collection to organize your favorite designs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter collection name"
                maxLength={100}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your collection (optional)"
                maxLength={500}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCollectionDialog;