
import { useState } from 'react';
import { Comment } from '@/types/nft';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, MessageCircle, User as UserIcon } from 'lucide-react';
import { createComment } from '@/services/commentService';
import { useToast } from '@/components/ui/use-toast';
import LikeButton from './LikeButton';

interface CommentItemProps {
  comment: Comment;
  userProfile: any;
  onCommentAdded: () => void;
  onDeleteComment: (commentId: string) => void;
  onUsernameClick: (username: string) => void;
  deletingCommentId: string | null;
  depth?: number;
}

const CommentItem = ({ 
  comment, 
  userProfile, 
  onCommentAdded, 
  onDeleteComment, 
  onUsernameClick, 
  deletingCommentId,
  depth = 0 
}: CommentItemProps) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const { toast } = useToast();

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !userProfile) return;
    
    setSubmittingReply(true);
    try {
      await createComment(comment.nftId, replyContent.trim(), userProfile.id, comment.id);
      setReplyContent('');
      setShowReplyForm(false);
      
      toast({
        title: "Reply posted",
        description: "Your reply has been added successfully",
      });

      onCommentAdded();
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast({
        title: "Failed to post reply",
        description: "There was an error posting your reply. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  // Extract username from author string for navigation
  const extractUsername = (authorString: string) => {
    const match = authorString.match(/@([a-zA-Z0-9_]+)/);
    return match ? match[1] : authorString;
  };

  const maxDepth = 3; // Limit nesting depth to avoid UI issues
  const showReplies = depth < maxDepth;
  const indentLevel = Math.min(depth, 2); // Max visual indent

  return (
    <div className={`${indentLevel > 0 ? `ml-${indentLevel * 6} border-l-2 border-muted pl-4` : ''}`}>
      <div className="group bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all duration-200">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 border-2 border-muted">
            {comment.avatarUrl ? (
              <AvatarImage src={comment.avatarUrl} alt={`${comment.author}'s avatar`} />
            ) : (
              <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                {comment.author.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onUsernameClick(extractUsername(comment.author))}
                  className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  {comment.author}
                </button>
                <span className="text-sm text-muted-foreground">
                  {formatDate(comment.timestamp)}
                </span>
              </div>
              
              {userProfile && comment.userId === userProfile.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteComment(comment.id)}
                  disabled={deletingCommentId === comment.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <p className="text-foreground leading-relaxed mb-3">{comment.content}</p>
            
            {userProfile && (
              <div className="flex items-center gap-2">
                <LikeButton 
                  type="comment" 
                  targetId={comment.id} 
                  initialLiked={comment.isLiked}
                  initialCount={comment.likeCount}
                  size="sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="h-8 px-3 text-muted-foreground hover:text-primary"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Reply Form */}
        {showReplyForm && userProfile && (
          <div className="mt-4 ml-14">
            <form onSubmit={handleSubmitReply} className="space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    <UserIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder={`Reply to ${extractUsername(comment.author)}...`}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[80px] border-muted focus:border-primary resize-none text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={!replyContent.trim() || submittingReply}
                >
                  {submittingReply ? 'Posting...' : 'Reply'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              userProfile={userProfile}
              onCommentAdded={onCommentAdded}
              onDeleteComment={onDeleteComment}
              onUsernameClick={onUsernameClick}
              deletingCommentId={deletingCommentId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
