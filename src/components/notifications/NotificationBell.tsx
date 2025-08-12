import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { NotificationList } from './NotificationList';
import { getUnreadNotificationCount } from '@/services/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const { user, account, isWalletUser } = useAuth();
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user && isWalletUser && account) {
      fetchCurrentUserProfile();
    }
  }, [user, isWalletUser, account]);

  const fetchCurrentUserProfile = async () => {
    if (!account) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', account.address)
        .maybeSingle();
      
      if (!error && profile) {
        setCurrentUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching current user profile:', error);
    }
  };

  useEffect(() => {
    if (currentUserProfile?.id || (user && !isWalletUser)) {
      fetchUnreadCount();
      
      // Set up real-time subscription for new notifications
      const userId = isWalletUser ? currentUserProfile?.id : user?.id;
      if (userId) {
        const subscription = supabase
          .channel('notifications')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'notifications',
              filter: `user_id=eq.${userId}`
            }, 
            () => {
              fetchUnreadCount();
            }
          )
          .on('postgres_changes', 
            { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'notifications',
              filter: `user_id=eq.${userId}`
            }, 
            () => {
              fetchUnreadCount();
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      }
    }
  }, [currentUserProfile, user, isWalletUser]);

  const fetchUnreadCount = async () => {
    try {
      const userId = isWalletUser ? currentUserProfile?.id : user?.id;
      if (!userId) return;
      
      const count = await getUnreadNotificationCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleNotificationRead = () => {
    fetchUnreadCount();
  };

  const currentUserId = isWalletUser ? currentUserProfile?.id : user?.id;

  if (!user || !currentUserId) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="end">
        <NotificationList 
          userId={currentUserId} 
          onNotificationRead={handleNotificationRead}
          onClose={() => setOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};