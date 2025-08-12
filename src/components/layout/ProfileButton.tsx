import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useQuery';
import { useActiveAccount } from 'thirdweb/react';
import { User } from 'lucide-react';

const ProfileButton = () => {
  const account = useActiveAccount();
  const { data: profile, isLoading } = useProfile(account?.address);

  if (isLoading) {
    return (
      <Button variant="ghost" className="h-auto p-2" disabled>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="flex flex-col items-start gap-1">
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="h-2 w-12 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </Button>
    );
  }

  if (!profile) {
    return null;
  }

  const displayName = profile.display_name || profile.username || 'Anonymous';
  const username = profile.username || account?.address?.substring(0, 8) || '';
  const avatarUrl = profile.avatar_url;

  return (
    <Button variant="ghost" className="h-auto p-2 hover:bg-accent" asChild>
      <Link to="/profile" className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start text-left">
          <span className="text-sm font-medium leading-none">
            {displayName}
          </span>
          <span className="text-xs text-muted-foreground leading-none mt-1">
            @{username}
          </span>
        </div>
      </Link>
    </Button>
  );
};

export default ProfileButton;