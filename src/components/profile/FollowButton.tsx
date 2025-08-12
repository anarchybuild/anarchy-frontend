import { Button } from '@/components/ui/button';
import { useOptimisticFollow } from '@/hooks/useQuery';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  userId: string;
  currentUserId: string;
  isFollowing: boolean;
  onFollowChange: () => void;
}

export const FollowButton = ({ userId, currentUserId, isFollowing, onFollowChange }: FollowButtonProps) => {
  const { toast } = useToast();
  const optimisticFollow = useOptimisticFollow();

  const handleFollowToggle = async () => {
    if (!currentUserId || currentUserId === userId) return;

    try {
      await optimisticFollow.mutateAsync({
        followingId: userId,
        currentUserId,
        isFollowing,
      });

      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing 
          ? "You are no longer following this user."
          : "You are now following this user.",
      });

      onFollowChange();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!currentUserId || currentUserId === userId) {
    return null;
  }

  return (
    <Button
      onClick={handleFollowToggle}
      disabled={optimisticFollow.isPending}
      variant={isFollowing ? "outline" : "default"}
      className="min-w-[100px]"
    >
      {optimisticFollow.isPending ? "..." : isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
};