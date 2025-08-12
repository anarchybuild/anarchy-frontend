import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'reply' | 'follow';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  from_user_id: string;
  design_id?: string;
  comment_id?: string;
  from_user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export const createNotification = async (notification: {
  user_id: string;
  type: 'like' | 'comment' | 'reply' | 'follow';
  title: string;
  message: string;
  from_user_id: string;
  design_id?: string;
  comment_id?: string;
}) => {
  try {
    // Don't create notification if user is notifying themselves
    if (notification.user_id === notification.from_user_id) {
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .insert([notification]);

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in createNotification:', error);
    throw error;
  }
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    // First get the notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    if (!notifications || notifications.length === 0) {
      return [];
    }

    // Get unique from_user_ids
    const fromUserIds = [...new Set(notifications.map(n => n.from_user_id))];

    // Fetch the profiles separately
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', fromUserIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
    }

    // Create a map for quick lookup
    const profileMap = new Map();
    if (profiles) {
      profiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
    }

    // Combine notifications with profile data
    return notifications.map((notification: any) => ({
      ...notification,
      from_user: profileMap.get(notification.from_user_id) || null
    }));
  } catch (error) {
    console.error('Error in getNotifications:', error);
    return [];
  }
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error);
    return 0;
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    throw error;
  }
};

// Helper functions to create specific notification types
export const createLikeNotification = async (designId: string, designOwnerId: string, fromUserId: string, fromUsername: string) => {
  await createNotification({
    user_id: designOwnerId,
    type: 'like',
    title: 'New Like',
    message: `${fromUsername} liked your design`,
    from_user_id: fromUserId,
    design_id: designId
  });
};

export const createCommentNotification = async (designId: string, designOwnerId: string, fromUserId: string, fromUsername: string, commentId: string) => {
  await createNotification({
    user_id: designOwnerId,
    type: 'comment',
    title: 'New Comment',
    message: `${fromUsername} commented on your design`,
    from_user_id: fromUserId,
    design_id: designId,
    comment_id: commentId
  });
};

export const createReplyNotification = async (parentCommentUserId: string, fromUserId: string, fromUsername: string, commentId: string, designId: string) => {
  await createNotification({
    user_id: parentCommentUserId,
    type: 'reply',
    title: 'New Reply',
    message: `${fromUsername} replied to your comment`,
    from_user_id: fromUserId,
    design_id: designId,
    comment_id: commentId
  });
};

export const createCommentLikeNotification = async (commentId: string, commentOwnerId: string, fromUserId: string, fromUsername: string, designId: string) => {
  await createNotification({
    user_id: commentOwnerId,
    type: 'like',
    title: 'Comment Liked',
    message: `${fromUsername} liked your comment`,
    from_user_id: fromUserId,
    design_id: designId,
    comment_id: commentId
  });
};

export const createFollowNotification = async (followedUserId: string, fromUserId: string, fromUsername: string) => {
  await createNotification({
    user_id: followedUserId,
    type: 'follow',
    title: 'New Follower',
    message: `${fromUsername} started following you`,
    from_user_id: fromUserId
  });
};