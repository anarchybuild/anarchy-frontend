
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRound, MapPin, Link as LinkIcon, X, Instagram, Linkedin, Github } from 'lucide-react';
import EditUsernameDialog from './EditUsernameDialog';
import EditDisplayNameDialog from './EditDisplayNameDialog';
import EditDescriptionDialog from './EditDescriptionDialog';
import EditLocationDialog from './EditLocationDialog';
import EditWebsiteDialog from './EditWebsiteDialog';
import EditAvatarDialog from './EditAvatarDialog';
import EditSocialLinksDialog from './EditSocialLinksDialog';
import { FollowButton } from './FollowButton';

interface ProfileHeaderProps {
  profile: any;
  displayUsername: string;
  walletAddress: string;
  onProfileUpdated: () => void;
  currentUserId?: string;
  isFollowing?: boolean;
  onFollowChange?: () => void;
}

const ProfileHeader = ({ 
  profile, 
  displayUsername, 
  walletAddress, 
  onProfileUpdated, 
  currentUserId, 
  isFollowing, 
  onFollowChange 
}: ProfileHeaderProps) => {
  const description = profile?.description || '';
  const location = profile?.location || '';
  const website = profile?.website || '';
  const avatarUrl = profile?.avatar_url || null;
  const displayName = profile?.display_name || '';
  const twitterUrl = profile?.twitter_url || '';
  const instagramUrl = profile?.instagram_url || '';
  const linkedinUrl = profile?.linkedin_url || '';
  const githubUrl = profile?.github_url || '';

  const socialLinks = [
    { url: twitterUrl, icon: X, label: 'X' },
    { url: instagramUrl, icon: Instagram, label: 'Instagram' },
    { url: linkedinUrl, icon: Linkedin, label: 'LinkedIn' },
    { url: githubUrl, icon: Github, label: 'Github' }
  ].filter(link => link.url);

  return (
    <div className="mb-10 flex flex-col md:flex-row gap-6">
      {/* Avatar */}
      <div className="flex justify-center md:justify-start relative">
        <div className="relative">
          {avatarUrl ? (
            <Avatar className="h-28 w-28">
              <AvatarImage src={avatarUrl} alt="Profile" />
              <AvatarFallback>{displayUsername[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-28 w-28">
              <AvatarFallback>
                <UserRound size={48} />
              </AvatarFallback>
            </Avatar>
          )}
          <EditAvatarDialog 
            currentAvatarUrl={avatarUrl}
            profileId={profile.id}
            onAvatarUpdated={onProfileUpdated}
          />
        </div>
      </div>
      
      {/* User Info */}
      <div className="flex-1">
        <div className="flex flex-col md:flex-row justify-between mb-2">
          <div className="mb-2 md:mb-0">
            {/* Display Name */}
            {displayName && (
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">
                  {displayName}
                </h1>
                <EditDisplayNameDialog 
                  currentDisplayName={displayName}
                  profileId={profile.id}
                  onDisplayNameUpdated={onProfileUpdated}
                />
              </div>
            )}
            
            {/* Username */}
            <div className="flex items-center gap-2">
              <h2 className={`${displayName ? 'text-lg text-muted-foreground' : 'text-2xl font-bold'}`}>
                @{displayUsername}
              </h2>
              <EditUsernameDialog 
                currentUsername={profile?.username || ''} 
                profileId={profile.id}
                walletAddress={walletAddress}
                onUsernameUpdated={onProfileUpdated}
              />
              {!displayName && (
                <EditDisplayNameDialog 
                  currentDisplayName={displayName}
                  profileId={profile.id}
                  onDisplayNameUpdated={onProfileUpdated}
                />
              )}
            </div>
          </div>
          
          {/* Follow Button */}
          {currentUserId && onFollowChange && (
            <div className="flex justify-center md:justify-end">
              <FollowButton
                userId={profile.id}
                currentUserId={currentUserId}
                isFollowing={isFollowing || false}
                onFollowChange={onFollowChange}
              />
            </div>
          )}
        </div>
        
        {/* Description */}
        <div className="mb-4">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              {description ? (
                <p className="text-muted-foreground">{description}</p>
              ) : (
                <p className="text-muted-foreground italic">No description yet</p>
              )}
            </div>
            <EditDescriptionDialog 
              currentDescription={description}
              profileId={profile.id}
              onDescriptionUpdated={onProfileUpdated}
            />
          </div>
        </div>
        
        {/* Location & Website */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={16} />
            <div className="flex items-center gap-2">
              {location ? (
                <span>{location}</span>
              ) : (
                <span className="italic">No location set</span>
              )}
              <EditLocationDialog 
                currentLocation={location}
                profileId={profile.id}
                onLocationUpdated={onProfileUpdated}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LinkIcon size={16} />
            <div className="flex items-center gap-2">
              {website ? (
                <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer">{website}</a>
              ) : (
                <span className="italic">No website set</span>
              )}
              <EditWebsiteDialog 
                currentWebsite={website}
                profileId={profile.id}
                onWebsiteUpdated={onProfileUpdated}
              />
            </div>
          </div>
        </div>
        
        {/* Social Links */}
        <div className="flex items-center gap-4">
          {socialLinks.length > 0 ? (
            socialLinks.map((link, index) => {
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
            })
          ) : (
            <span className="text-muted-foreground italic text-sm">No social links added</span>
          )}
          <EditSocialLinksDialog 
            currentTwitter={twitterUrl}
            currentInstagram={instagramUrl}
            currentLinkedin={linkedinUrl}
            currentGithub={githubUrl}
            profileId={profile.id}
            onSocialLinksUpdated={onProfileUpdated}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
