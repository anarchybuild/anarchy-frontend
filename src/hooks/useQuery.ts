import { useQuery as useReactQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NFT } from '@/types/nft';
import { fetchDesigns, fetchUserDesigns, fetchDesignById } from '@/services/designService';
import { getFollowStats, getFollowers, getFollowing } from '@/services/followService';

// Cache keys
export const QUERY_KEYS = {
  designs: (userId?: string) => ['designs', userId] as const,
  userDesigns: (userId: string) => ['designs', 'user', userId] as const,
  design: (id: string) => ['design', id] as const,
  profile: (walletAddress: string) => ['profile', walletAddress] as const,
  profileById: (id: string) => ['profile', 'id', id] as const,
  followStats: (userId: string, currentUserId?: string) => ['followStats', userId, currentUserId] as const,
  followers: (userId: string) => ['followers', userId] as const,
  following: (userId: string) => ['following', userId] as const,
  notifications: (userId: string) => ['notifications', userId] as const,
};

// Profile hooks
export const useProfile = (walletAddress: string | undefined) => {
  return useReactQuery({
    queryKey: QUERY_KEYS.profile(walletAddress || ''),
    queryFn: async () => {
      if (!walletAddress) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useProfileById = (id: string | undefined) => {
  return useReactQuery({
    queryKey: QUERY_KEYS.profileById(id || ''),
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Design hooks with infinite scrolling
export const useDesigns = (userId?: string) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.designs(userId),
    queryFn: ({ pageParam = 0 }) => fetchDesigns({ userId, limit: 20, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer than 20 items, we've reached the end
      if (lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserDesigns = (userId: string | undefined) => {
  return useReactQuery({
    queryKey: QUERY_KEYS.userDesigns(userId || ''),
    queryFn: () => fetchUserDesigns(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useDesign = (id: string | undefined, userId?: string) => {
  return useReactQuery({
    queryKey: QUERY_KEYS.design(id || ''),
    queryFn: () => fetchDesignById(id!, userId),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Follow hooks
export const useFollowStats = (userId: string | undefined, currentUserId?: string) => {
  return useReactQuery({
    queryKey: QUERY_KEYS.followStats(userId || '', currentUserId),
    queryFn: () => getFollowStats(userId!, currentUserId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000,
  });
};

export const useFollowers = (userId: string | undefined) => {
  return useReactQuery({
    queryKey: QUERY_KEYS.followers(userId || ''),
    queryFn: () => getFollowers(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
};

export const useFollowing = (userId: string | undefined) => {
  return useReactQuery({
    queryKey: QUERY_KEYS.following(userId || ''),
    queryFn: () => getFollowing(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Parallel profile data hook - fetches all profile-related data in parallel
export const useProfileData = (walletAddress: string | undefined) => {
  const profileQuery = useProfile(walletAddress);
  const userDesignsQuery = useUserDesigns(profileQuery.data?.id);
  const followStatsQuery = useFollowStats(profileQuery.data?.id, profileQuery.data?.id);

  return {
    profile: profileQuery.data,
    designs: userDesignsQuery.data || [],
    followStats: followStatsQuery.data || { followersCount: 0, followingCount: 0, isFollowing: false },
    loading: profileQuery.isLoading,
    loadingDesigns: userDesignsQuery.isLoading,
    error: profileQuery.error || userDesignsQuery.error || followStatsQuery.error,
    refetch: () => {
      profileQuery.refetch();
      userDesignsQuery.refetch();
      followStatsQuery.refetch();
    },
  };
};

// Public profile data hook - fetches all public profile data in parallel
export const usePublicProfileData = (username: string | undefined, currentUserId?: string) => {
  const profileQuery = useReactQuery({
    queryKey: ['profile', 'username', username],
    queryFn: async () => {
      if (!username) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });

  const userDesignsQuery = useUserDesigns(profileQuery.data?.id);
  const followStatsQuery = useFollowStats(profileQuery.data?.id, currentUserId);

  return {
    profile: profileQuery.data,
    designs: userDesignsQuery.data || [],
    followStats: followStatsQuery.data || { followersCount: 0, followingCount: 0, isFollowing: false },
    loading: profileQuery.isLoading,
    loadingDesigns: userDesignsQuery.isLoading,
    error: profileQuery.error || userDesignsQuery.error || followStatsQuery.error,
    refetch: () => {
      profileQuery.refetch();
      userDesignsQuery.refetch();
      followStatsQuery.refetch();
    },
  };
};

// Optimistic mutations
export const useOptimisticLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ designId, userId, isLiked }: { designId: string; userId: string; isLiked: boolean }) => {
      // Actual API call would go here
      const { toggleDesignLike } = await import('@/services/likeService');
      return toggleDesignLike(designId, userId);
    },
    onMutate: async ({ designId, isLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.design(designId) });
      await queryClient.cancelQueries({ queryKey: ['designs'] });

      // Snapshot previous values
      const previousDesign = queryClient.getQueryData(QUERY_KEYS.design(designId));
      const previousDesigns = queryClient.getQueryData(['designs']);

      // Optimistically update design
      queryClient.setQueryData(QUERY_KEYS.design(designId), (old: NFT | undefined) => {
        if (!old) return old;
        return {
          ...old,
          isLiked: !isLiked,
          likeCount: isLiked ? old.likeCount - 1 : old.likeCount + 1,
        };
      });

      // Optimistically update all designs lists
      queryClient.getQueriesData({ queryKey: ['designs'] }).forEach(([queryKey, data]) => {
        if (data && Array.isArray(data)) {
          queryClient.setQueryData(queryKey, (old: NFT[] | undefined) => {
            if (!old) return old;
            return old.map(design => 
              design.id === designId 
                ? { ...design, isLiked: !isLiked, likeCount: isLiked ? design.likeCount - 1 : design.likeCount + 1 }
                : design
            );
          });
        }
      });

      return { previousDesign, previousDesigns };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousDesign) {
        queryClient.setQueryData(QUERY_KEYS.design(variables.designId), context.previousDesign);
      }
      if (context?.previousDesigns) {
        queryClient.setQueryData(['designs'], context.previousDesigns);
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.design(variables.designId) });
      queryClient.invalidateQueries({ queryKey: ['designs'] });
    },
  });
};

export const useOptimisticFollow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ followingId, currentUserId, isFollowing }: { followingId: string; currentUserId: string; isFollowing: boolean }) => {
      const { followUser, unfollowUser } = await import('@/services/followService');
      if (isFollowing) {
        await unfollowUser(followingId, currentUserId);
      } else {
        await followUser(followingId, currentUserId);
      }
    },
    onMutate: async ({ followingId, currentUserId, isFollowing }) => {
      const queryKey = QUERY_KEYS.followStats(followingId, currentUserId);
      await queryClient.cancelQueries({ queryKey });

      const previousStats = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isFollowing: !isFollowing,
          followersCount: isFollowing ? old.followersCount - 1 : old.followersCount + 1,
        };
      });

      return { previousStats };
    },
    onError: (err, variables, context) => {
      if (context?.previousStats) {
        queryClient.setQueryData(
          QUERY_KEYS.followStats(variables.followingId, variables.currentUserId),
          context.previousStats
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.followStats(variables.followingId, variables.currentUserId) 
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.followers(variables.followingId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.following(variables.currentUserId) });
    },
  });
};

export const useDeleteDesign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ designId, userId }: { designId: string; userId: string }) => {
      const { deleteDesign } = await import('@/services/designService');
      return deleteDesign(designId, userId);
    },
    onSuccess: (_, variables) => {
      // Remove from all relevant caches
      queryClient.removeQueries({ queryKey: QUERY_KEYS.design(variables.designId) });
      
      // Update designs lists by filtering out the deleted design
      queryClient.getQueriesData({ queryKey: ['designs'] }).forEach(([queryKey, data]) => {
        if (data && Array.isArray(data)) {
          const filteredDesigns = data.filter((design: NFT) => design.id !== variables.designId);
          queryClient.setQueryData(queryKey, filteredDesigns);
        }
      });

      // Update user designs cache
      queryClient.getQueriesData({ queryKey: ['designs', 'user'] }).forEach(([queryKey, data]) => {
        if (data && Array.isArray(data)) {
          const filteredDesigns = data.filter((design: NFT) => design.id !== variables.designId);
          queryClient.setQueryData(queryKey, filteredDesigns);
        }
      });
    },
  });
};