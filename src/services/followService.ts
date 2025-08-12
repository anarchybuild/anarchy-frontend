import { supabase } from '@/integrations/supabase/client';
import { createFollowNotification } from './notificationService';

export interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface FollowUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export const followUser = async (followingId: string, currentUserId: string) => {
  // Get user info for notification
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', currentUserId)
    .single();

  const { error } = await supabase
    .from('follows')
    .insert([
      {
        follower_id: currentUserId,
        following_id: followingId,
      },
    ]);

  if (error) {
    console.error('Error following user:', error);
    throw error;
  }

  // Create follow notification
  if (userProfile) {
    try {
      const username = userProfile.display_name || userProfile.username || 'Someone';
      await createFollowNotification(followingId, currentUserId, username);
    } catch (error) {
      console.error('Error creating follow notification:', error);
      // Don't throw here to avoid breaking the follow functionality
    }
  }
};

export const unfollowUser = async (followingId: string, currentUserId: string) => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', currentUserId)
    .eq('following_id', followingId);

  if (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

export const getFollowStats = async (userId: string, currentUserId?: string): Promise<FollowStats> => {
  try {
    // Get followers count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact' })
      .eq('following_id', userId);

    // Get following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact' })
      .eq('follower_id', userId);

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .single();
      
      isFollowing = !!followData;
    }

    return {
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      isFollowing,
    };
  } catch (error) {
    console.error('Error getting follow stats:', error);
    return {
      followersCount: 0,
      followingCount: 0,
      isFollowing: false,
    };
  }
};

export const getFollowers = async (userId: string): Promise<FollowUser[]> => {
  console.log('Fetching followers for user ID:', userId);
  
  // First get the follower IDs
  const { data: followData, error: followError } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId);

  console.log('Follow data result:', { followData, followError });

  if (followError) {
    console.error('Error getting follow relationships:', followError);
    return [];
  }

  if (!followData || followData.length === 0) {
    console.log('No followers found');
    return [];
  }

  // Get the follower profile details
  const followerIds = followData.map(f => f.follower_id);
  console.log('Follower IDs:', followerIds);

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', followerIds);

  console.log('Profile data result:', { profileData, profileError });

  if (profileError) {
    console.error('Error getting follower profiles:', profileError);
    return [];
  }

  const followers = profileData?.map((profile: any) => ({
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
  })) || [];

  console.log('Processed followers:', followers);
  return followers;
};

export const getFollowing = async (userId: string): Promise<FollowUser[]> => {
  console.log('Fetching following for user ID:', userId);
  
  // First get the following IDs
  const { data: followData, error: followError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  console.log('Follow data result:', { followData, followError });

  if (followError) {
    console.error('Error getting follow relationships:', followError);
    return [];
  }

  if (!followData || followData.length === 0) {
    console.log('No following found');
    return [];
  }

  // Get the following profile details
  const followingIds = followData.map(f => f.following_id);
  console.log('Following IDs:', followingIds);

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', followingIds);

  console.log('Profile data result:', { profileData, profileError });

  if (profileError) {
    console.error('Error getting following profiles:', profileError);
    return [];
  }

  const following = profileData?.map((profile: any) => ({
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
  })) || [];

  console.log('Processed following:', following);
  return following;
};