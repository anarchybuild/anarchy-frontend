import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDeleteDesign } from '@/hooks/useQuery';
import { useToast } from '@/hooks/use-toast';

interface DeleteButtonProps {
  designId: string;
  userId: string;
  designName: string;
  size?: 'sm' | 'default';
}

const DeleteButton = ({ designId, userId, designName, size = 'default' }: DeleteButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const deleteDesignMutation = useDeleteDesign();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteDesignMutation.mutateAsync({ designId, userId });
      toast({
        title: "Design deleted",
        description: `"${designName}" has been deleted successfully.`,
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to delete design:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete design",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 justify-start gap-2 w-full"
        >
          <Trash2 className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
          <span>Delete post</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Design</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{designName}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteDesignMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteDesignMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteButton;