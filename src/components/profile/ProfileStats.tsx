
import { FollowersDialog } from './FollowersDialog';

interface ProfileStatsProps {
  creationsCount: number;
  followersCount: number;
  followingCount: number;
  userId: string;
}

const ProfileStats = ({ creationsCount, followersCount, followingCount, userId }: ProfileStatsProps) => {
  return (
    <div className="flex gap-6 mb-4">
      <div>
        <span className="font-bold">{creationsCount}</span> <span className="text-muted-foreground">designs</span>
      </div>
      
      <FollowersDialog userId={userId} type="followers" count={followersCount}>
        <button className="hover:text-primary transition-colors">
          <span className="font-bold">{followersCount}</span> <span className="text-muted-foreground">followers</span>
        </button>
      </FollowersDialog>
      
      <FollowersDialog userId={userId} type="following" count={followingCount}>
        <button className="hover:text-primary transition-colors">
          <span className="font-bold">{followingCount}</span> <span className="text-muted-foreground">following</span>
        </button>
      </FollowersDialog>
    </div>
  );
};

export default ProfileStats;
