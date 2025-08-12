
import { supabase } from '@/integrations/supabase/client';
import { Comment } from '@/types/nft';
import { createCommentNotification, createReplyNotification } from './notificationService';

export const createComment = async (designId: string, content: string, userId: string, parentId?: string) => {
  console.log('Creating comment:', { designId, content, userId, parentId });
  
  // Get user info for notification
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', userId)
    .single();

  // Get design owner info for notifications
  const { data: design } = await supabase
    .from('designs')
    .select('user_id')
    .eq('id', designId)
    .single();

  // If this is a reply, get the parent comment info
  let parentComment = null;
  if (parentId) {
    const { data } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', parentId)
      .single();
    parentComment = data;
  }
  
  const { data, error } = await supabase
    .from('comments')
    .insert({
      design_id: designId,
      user_id: userId,
      content: content,
      parent_id: parentId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    throw error;
  }

  console.log('Comment created successfully:', data);

  // Create notifications
  if (userProfile && design && data) {
    const username = userProfile.display_name || userProfile.username || 'Someone';
    
    try {
      if (parentId && parentComment && parentComment.user_id !== userId) {
        // This is a reply - notify the parent comment author
        await createReplyNotification(
          parentComment.user_id,
          userId,
          username,
          data.id,
          designId
        );
      } else if (!parentId && design.user_id !== userId) {
        // This is a top-level comment - notify the design owner
        await createCommentNotification(
          designId,
          design.user_id,
          userId,
          username,
          data.id
        );
      }
    } catch (error) {
      console.error('Error creating comment notification:', error);
      // Don't throw here to avoid breaking the comment functionality
    }
  }

  return data;
};

export const deleteComment = async (commentId: string, userId: string) => {
  console.log('Deleting comment:', { commentId, userId });
  
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }

  console.log('Comment deleted successfully');
};

export const fetchCommentsByDesignId = async (designId: string): Promise<Comment[]> => {
  console.log('Fetching comments for design ID:', designId);
  
  try {
    // Fetch all comments for this design
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('design_id', designId)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      throw commentsError;
    }

    console.log('Raw comments from database:', comments);

    if (!comments || comments.length === 0) {
      console.log('No comments found for design:', designId);
      return [];
    }

    // Fetch profiles for the comment authors (including display_name)
    const userIds = [...new Set(comments.map(comment => comment.user_id))];
    console.log('Fetching profiles for user IDs:', userIds);
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, name, avatar_url, display_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles for comments:', profilesError);
    }

    console.log('Profiles fetched:', profiles);

    // Create a map of user profiles for easy lookup
    const profileMap = new Map();
    if (profiles) {
      profiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
    }

    // Transform comments and build the thread structure
    const commentMap = new Map<string, Comment>();
    const topLevelComments: Comment[] = [];

    // First pass: create all comment objects
    comments.forEach((comment: any) => {
      const profile = profileMap.get(comment.user_id);
      
      // Format author name like X/Twitter: "Display Name @username" or just "@username" if no display name
      let authorDisplay = '';
      if (profile?.display_name) {
        authorDisplay = `${profile.display_name} @${profile.username || `User ${comment.user_id.substring(0, 8)}`}`;
      } else {
        authorDisplay = `@${profile?.username || profile?.name || `User ${comment.user_id.substring(0, 8)}`}`;
      }
      
      const transformedComment: Comment = {
        id: comment.id,
        nftId: comment.design_id,
        author: authorDisplay,
        content: comment.content,
        timestamp: comment.created_at,
        userId: comment.user_id,
        avatarUrl: profile?.avatar_url,
        parentId: comment.parent_id,
        replies: [],
      };
      commentMap.set(comment.id, transformedComment);
    });

    // Second pass: build the thread structure
    commentMap.forEach(comment => {
      if (comment.parentId) {
        // This is a reply, add it to its parent's replies array
        const parentComment = commentMap.get(comment.parentId);
        if (parentComment) {
          parentComment.replies!.push(comment);
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(comment);
      }
    });

    console.log('Final processed comments:', topLevelComments);
    return topLevelComments;
  } catch (error) {
    console.error('Error in fetchCommentsByDesignId:', error);
    throw error;
  }
};
