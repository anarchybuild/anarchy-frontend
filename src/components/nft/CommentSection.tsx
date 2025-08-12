import { useState, useEffect } from 'react';
import { Comment } from '@/types/nft';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare } from 'lucide-react';
import { deleteComment } from '@/services/commentService';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import CommentItem from './CommentItem';
import { useAuth } from '@/hooks/useAuth';
import { createWalletProfile } from '@/services/profileService';

interface CommentSectionProps {
  nftId: string;
  comments: Comment[];
  onCommentAdded?: () => void;
}

const CommentSection = ({ nftId, comments, onCommentAdded }: CommentSectionProps) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isSignedIn, user, account, isSupabaseUser, isWalletUser } = useAuth();

  // Fetch user profile based on authentication type
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      console.log('Fetching user profile - isSupabaseUser:', isSupabaseUser, 'isWalletUser:', isWalletUser, 'user:', user?.id, 'account:', account?.address);
      
      try {
        if (isSupabaseUser && user?.id) {
          // Supabase authenticated user
          console.log('Fetching profile for Supabase user:', user.id);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching Supabase user profile:', error);
          } else {
            console.log('Found Supabase user profile:', profile);
            setUserProfile(profile);
          }
        } else if (isWalletUser && account?.address) {
          // Wallet-only user (only when no Supabase user)
          console.log('Creating/fetching wallet profile for:', account.address);
          const profileResult = await createWalletProfile(account.address);
          
          if (profileResult.success && profileResult.profile) {
            console.log('Wallet profile result:', profileResult.profile);
            setUserProfile(profileResult.profile);
          } else {
            console.error('Failed to create/fetch wallet profile:', profileResult.error);
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn) {
      fetchUserProfile();
    } else {
      setLoading(false);
      setUserProfile(null);
    }
  }, [user?.id, account?.address, isSupabaseUser, isWalletUser, isSignedIn]);


  const handleDeleteComment = async (commentId: string) => {
    if (!userProfile) return;
    
    setDeletingCommentId(commentId);
    try {
      await deleteComment(commentId, userProfile.id);
      
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully",
      });

      // Trigger refresh of comments
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Failed to delete comment",
        description: "There was an error deleting your comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleUsernameClick = (username: string) => {
    navigate(`/user/${username}`);
  };

  // Count total comments including replies
  const countAllComments = (comments: Comment[]): number => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? countAllComments(comment.replies) : 0);
    }, 0);
  };

  const totalComments = countAllComments(comments);

  if (loading) {
    return (
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-bold">Comments</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-muted h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('Rendering CommentSection - isSignedIn:', isSignedIn, 'userProfile:', userProfile);

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold">Comments</h3>
        <Badge variant="secondary" className="ml-2">
          {totalComments}
        </Badge>
      </div>

      {/* Add bottom padding to prevent content from being hidden by sticky input */}
      <div className="space-y-6 pb-32">
        {comments.length > 0 ? (
          comments.map((comment, index) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                userProfile={userProfile}
                onCommentAdded={() => onCommentAdded?.()}
                onDeleteComment={handleDeleteComment}
                onUsernameClick={handleUsernameClick}
                deletingCommentId={deletingCommentId}
              />
              
              {index < comments.length - 1 && (
                <div className="h-6 flex items-center justify-center">
                  <div className="w-px h-full bg-border"></div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-muted/30 border border-dashed border-muted rounded-xl p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-muted rounded-full p-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">No comments yet</h4>
                <p className="text-muted-foreground">Be the first to share your thoughts about this design!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
