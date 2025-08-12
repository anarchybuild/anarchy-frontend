
import { useActiveAccount } from 'thirdweb/react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useProfileData } from '@/hooks/useQuery';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { ProfileSkeleton } from '@/components/common/SkeletonLoader';

const Profile = () => {
  const { toast } = useToast();
  const account = useActiveAccount();
  
  // Use optimized parallel data fetching
  const { profile, designs, followStats, loading, loadingDesigns, error, refetch } = useProfileData(account?.address);

  // Handle errors
  if (error) {
    toast({
      title: "Error loading profile",
      description: "Could not load your profile information",
      variant: "destructive"
    });
  }

  const handleProfileUpdated = () => {
    console.log('Profile: Profile updated callback triggered');
    refetch();
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!account) {
    return (
      <div className="container max-w-6xl mx-auto py-10">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Wallet not connected</CardTitle>
            <CardDescription>Please connect your wallet to view your profile</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container max-w-6xl mx-auto py-10">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Profile not found</CardTitle>
            <CardDescription>Your profile could not be found. Please try reconnecting your wallet.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const displayUsername = profile?.username || account?.address?.substring(0, 8) || '';

  return (
    <div className="container max-w-6xl mx-auto py-10">
      <ProfileHeader 
        profile={profile}
        displayUsername={displayUsername}
        walletAddress={account?.address || ''}
        onProfileUpdated={handleProfileUpdated}
      />
      
      <ProfileStats 
        creationsCount={designs.length}
        followersCount={followStats.followersCount}
        followingCount={followStats.followingCount}
        userId={profile?.id || ''}
      />
      
      <ProfileTabs 
        ownedNFTs={designs}
        loadingNFTs={loadingDesigns}
        profile={profile}
        currentUserId={profile?.id}
      />
    </div>
  );
};

export default Profile;
