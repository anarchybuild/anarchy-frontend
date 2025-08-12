import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toggleDesignLike, toggleCommentLike } from '@/services/likeService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getProfileByWallet } from '@/services/profileService';

interface LikeButtonProps {
  type: 'design' | 'comment';
  targetId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onLikeChange?: (liked: boolean, count: number) => void;
  size?: 'sm' | 'default';
}

const LikeButton = ({ 
  type, 
  targetId, 
  initialLiked = false, 
  initialCount = 0, 
  onLikeChange,
  size = 'default'
}: LikeButtonProps) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Sync state when initial values change
  useEffect(() => {
    setIsLiked(initialLiked);
    setLikeCount(initialCount);
  }, [initialLiked, initialCount]);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please connect your wallet to like this content.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get the correct user ID - if it's a wallet user, get the profile ID
      let userId = user.id;
      if (user.id.startsWith('0x')) {
        const profile = await getProfileByWallet(user.id);
        if (!profile) {
          toast({
            title: "Profile not found",
            description: "Unable to find your profile. Please try refreshing the page.",
            variant: "destructive",
          });
          return;
        }
        userId = profile.id;
      }

      const result = type === 'design' 
        ? await toggleDesignLike(targetId, userId)
        : await toggleCommentLike(targetId, userId);

      setIsLiked(result.liked);
      setLikeCount(result.count);
      onLikeChange?.(result.liked, result.count);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'default'}
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-2 hover:bg-accent/50",
        size === 'sm' && "h-8 px-2"
      )}
    >
      <Heart 
        className={cn(
          size === 'sm' ? "h-3 w-3" : "h-4 w-4",
          isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"
        )} 
      />
      <span className={cn(
        "text-sm",
        isLiked ? "text-red-500" : "text-muted-foreground"
      )}>
        {likeCount}
      </span>
    </Button>
  );
};

export default LikeButton;