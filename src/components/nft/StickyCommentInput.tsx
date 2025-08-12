import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, User as UserIcon } from 'lucide-react';
import { createComment } from '@/services/commentService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { createWalletProfile } from '@/services/profileService';
import WalletButton from '@/components/wallet/WalletButton';
interface StickyCommentInputProps {
  nftId: string;
  onCommentAdded?: () => void;
}
const StickyCommentInput = ({
  nftId,
  onCommentAdded
}: StickyCommentInputProps) => {
  const [newComment, setNewComment] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const {
    toast
  } = useToast();
  const {
    isSignedIn,
    user,
    account,
    isSupabaseUser,
    isWalletUser
  } = useAuth();

  // Fetch user profile based on authentication type
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        if (isSupabaseUser && user?.id) {
          // Supabase authenticated user
          const {
            data: profile,
            error
          } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          if (error) {
            console.error('Error fetching Supabase user profile:', error);
          } else {
            setUserProfile(profile);
          }
        } else if (isWalletUser && account?.address) {
          // Wallet-only user
          const profileResult = await createWalletProfile(account.address);
          if (profileResult.success && profileResult.profile) {
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
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userProfile) {
      return;
    }
    setSubmittingComment(true);
    try {
      await createComment(nftId, newComment.trim(), userProfile.id);
      setNewComment('');
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully"
      });

      // Trigger refresh of comments
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Failed to post comment",
        description: "There was an error posting your comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingComment(false);
    }
  };
  if (loading) {
    return <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50">
        <div className="container max-w-6xl mx-auto">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-muted h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>;
  }
  return <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50">
      <div className="container max-w-6xl mx-auto">
        {!isSignedIn ? <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sign in to join the conversation</span>
            </div>
            <WalletButton />
          </div> : <div>
            {userProfile ? <form onSubmit={handleSubmitComment} className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 border border-border">
                    {userProfile?.avatar_url ? <AvatarImage src={userProfile.avatar_url} alt="Your avatar" /> : <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        <UserIcon className="h-4 w-4" />
                      </AvatarFallback>}
                  </Avatar>
                  <div className="flex-1 flex gap-3">
                    <Textarea placeholder="Share your thoughts about this design..." value={newComment} onChange={e => setNewComment(e.target.value)} className="min-h-[40px] max-h-[120px] border-muted focus:border-primary resize-none text-sm" rows={1} />
                    <Button type="submit" disabled={!newComment.trim() || submittingComment} size="sm" className="self-end">
                      {submittingComment ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              </form> : <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">Setting up your profile...</p>
              </div>}
          </div>}
      </div>
    </div>;
};
export default StickyCommentInput;