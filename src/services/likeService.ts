import { supabase } from '@/integrations/supabase/client';
import { createLikeNotification, createCommentLikeNotification } from './notificationService';

export interface LikeData {
  id: string;
  user_id: string;
  design_id?: string;
  comment_id?: string;
  created_at: string;
}

export const toggleDesignLike = async (designId: string, userId: string): Promise<{ liked: boolean; count: number }> => {
  // First get the design owner info for notifications
  const { data: design } = await supabase
    .from('designs')
    .select('user_id')
    .eq('id', designId)
    .single();

  // Get user info for notification
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', userId)
    .single();

  // Check if user has already liked this design
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('design_id', designId)
    .eq('user_id', userId)
    .maybeSingle();

  const isLiking = !existingLike;

  if (existingLike) {
    // Unlike - remove the like
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', existingLike.id);

    if (error) throw error;
  } else {
    // Like - add a new like
    const { error } = await supabase
      .from('likes')
      .insert({
        design_id: designId,
        user_id: userId,
      });

    if (error) throw error;

    // Create notification for design owner if it's a new like and not self-like
    if (design && userProfile && design.user_id !== userId) {
      try {
        const username = userProfile.display_name || userProfile.username || 'Someone';
        await createLikeNotification(designId, design.user_id, userId, username);
      } catch (error) {
        console.error('Error creating like notification:', error);
        // Don't throw here to avoid breaking the like functionality
      }
    }
  }

  // Get updated like count
  const { data: likes, error: countError } = await supabase
    .from('likes')
    .select('id')
    .eq('design_id', designId);

  if (countError) throw countError;

  return {
    liked: isLiking,
    count: likes?.length || 0,
  };
};

export const toggleCommentLike = async (commentId: string, userId: string): Promise<{ liked: boolean; count: number }> => {
  // Get comment owner and design info for notifications
  const { data: comment } = await supabase
    .from('comments')
    .select('user_id, design_id')
    .eq('id', commentId)
    .single();

  // Get user info for notification
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', userId)
    .single();

  // Check if user has already liked this comment
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .maybeSingle();

  const isLiking = !existingLike;

  if (existingLike) {
    // Unlike - remove the like
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', existingLike.id);

    if (error) throw error;
  } else {
    // Like - add a new like
    const { error } = await supabase
      .from('likes')
      .insert({
        comment_id: commentId,
        user_id: userId,
      });

    if (error) throw error;

    // Create notification for comment owner if it's a new like and not self-like
    if (comment && userProfile && comment.user_id !== userId) {
      try {
        const username = userProfile.display_name || userProfile.username || 'Someone';
        await createCommentLikeNotification(commentId, comment.user_id, userId, username, comment.design_id);
      } catch (error) {
        console.error('Error creating comment like notification:', error);
        // Don't throw here to avoid breaking the like functionality
      }
    }
  }

  // Get updated like count
  const { data: likes, error: countError } = await supabase
    .from('likes')
    .select('id')
    .eq('comment_id', commentId);

  if (countError) throw countError;

  return {
    liked: isLiking,
    count: likes?.length || 0,
  };
};

export const getDesignLikes = async (designId: string, userId?: string) => {
  const { data: likes, error } = await supabase
    .from('likes')
    .select('id, user_id')
    .eq('design_id', designId);

  if (error) throw error;

  return {
    count: likes?.length || 0,
    liked: userId ? likes?.some(like => like.user_id === userId) || false : false,
  };
};

export const getCommentLikes = async (commentId: string, userId?: string) => {
  const { data: likes, error } = await supabase
    .from('likes')
    .select('id, user_id')
    .eq('comment_id', commentId);

  if (error) throw error;

  return {
    count: likes?.length || 0,
    liked: userId ? likes?.some(like => like.user_id === userId) || false : false,
  };
};