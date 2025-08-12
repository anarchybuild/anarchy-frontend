
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRound, MapPin, Link as LinkIcon, ArrowLeft, Twitter, Instagram, Linkedin, Github } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePublicProfileData, useProfile } from '@/hooks/useQuery';
import { FollowButton } from '@/components/profile/FollowButton';
import { FollowersDialog } from '@/components/profile/FollowersDialog';
import NFTGrid from '@/components/nft/NFTGrid';
import { ProfileSkeleton } from '@/components/common/SkeletonLoader';

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, account, isWalletUser } = useAuth();

  // Get current user profile for follow functionality
  const { data: currentUserProfile } = useProfile(account?.address);
  
  // Get current user ID for follow stats
  const currentUserId = isWalletUser && currentUserProfile ? currentUserProfile.id : user?.id;
  
  // Use optimized parallel data fetching
  const { profile, designs, followStats, loading, loadingDesigns, error, refetch } = usePublicProfileData(username, currentUserId);

  // Handle errors
  if (error) {
    toast({
      title: "Error loading profile",
      description: "Could not load the user profile",
      variant: "destructive"
    });
  }

  const handleFollowChange = () => {
    refetch();
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="container max-w-6xl mx-auto py-10">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Profile not found</CardTitle>
            <CardDescription>The user profile you're looking for doesn't exist</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const displayUsername = profile.username || 'user';
  const displayName = profile.display_name || '';
  const twitterUrl = profile?.twitter_url || '';
  const instagramUrl = profile?.instagram_url || '';
  const linkedinUrl = profile?.linkedin_url || '';
  const githubUrl = profile?.github_url || '';

  const socialLinks = [
    { url: twitterUrl, icon: Twitter, label: 'Twitter' },
    { url: instagramUrl, icon: Instagram, label: 'Instagram' },
    { url: linkedinUrl, icon: Linkedin, label: 'LinkedIn' },
    { url: githubUrl, icon: Github, label: 'Github' }
  ].filter(link => link.url);

  return (
    <div className="container max-w-6xl mx-auto py-10">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 hover:bg-transparent p-0 h-auto flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </Button>

      {/* Profile Header */}
      <div className="mb-10 flex flex-col md:flex-row gap-6">
        {/* Avatar */}
        <div className="flex justify-center md:justify-start">
          {profile.avatar_url ? (
            <Avatar className="h-28 w-28">
              <AvatarImage src={profile.avatar_url} alt="Profile" />
              <AvatarFallback>{displayUsername[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-28 w-28">
              <AvatarFallback>
                <UserRound size={48} />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        
        {/* User Info */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row justify-between mb-2">
            <div className="mb-2 md:mb-0">
            {/* Display Name */}
            {displayName && (
              <h1 className="text-2xl font-bold mb-1">{displayName}</h1>
            )}
            
            {/* Username */}
            <h2 className={`${displayName ? 'text-lg text-muted-foreground' : 'text-2xl font-bold'}`}>
              @{displayUsername}
            </h2>
            </div>
            
            {/* Follow Button */}
            {user && (
              <div className="flex justify-center md:justify-end">
                <FollowButton
                  userId={profile.id}
                  currentUserId={isWalletUser && currentUserProfile ? currentUserProfile.id : user.id}
                  isFollowing={followStats.isFollowing}
                  onFollowChange={handleFollowChange}
                />
              </div>
            )}
          </div>
          
          {/* Description */}
          {profile.description && (
            <div className="mb-4">
              <p className="text-muted-foreground">{profile.description}</p>
            </div>
          )}
          
          {/* Location & Website */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {profile.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={16} />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LinkIcon size={16} />
                <a 
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  {profile.website}
                </a>
              </div>
            )}
          </div>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="flex gap-4 mb-4">
              {socialLinks.map((link, index) => {
                const IconComponent = link.icon;
                return (
                  <a 
                    key={index}
                    href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary" 
                    aria-label={link.label}
                  >
                    <IconComponent size={20} />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Profile Stats */}
      <div className="flex gap-6 mb-8">
        <div>
          <span className="font-bold">{designs.length}</span> <span className="text-muted-foreground">designs</span>
        </div>
        
        <FollowersDialog userId={profile.id} type="followers" count={followStats.followersCount}>
          <button className="hover:text-primary transition-colors">
            <span className="font-bold">{followStats.followersCount}</span> <span className="text-muted-foreground">followers</span>
          </button>
        </FollowersDialog>
        
        <FollowersDialog userId={profile.id} type="following" count={followStats.followingCount}>
          <button className="hover:text-primary transition-colors">
            <span className="font-bold">{followStats.followingCount}</span> <span className="text-muted-foreground">following</span>
          </button>
        </FollowersDialog>
      </div>

      {/* User's Designs */}
      <div>
        <h2 className="text-xl font-bold mb-6">Designs</h2>
        {loadingDesigns ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading designs...</p>
          </div>
        ) : designs.length > 0 ? (
          <NFTGrid nfts={designs} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No designs yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
