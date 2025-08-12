
import { Link } from 'react-router-dom';
import { NFT } from '@/types/nft';
import LikeButton from './LikeButton';
import AddToCollectionButton from '@/components/collections/AddToCollectionButton';
import DeleteButton from './DeleteButton';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useQuery';

interface NFTCardProps {
  nft: NFT;
}

const NFTCard = ({ nft }: NFTCardProps) => {
  const { user } = useAuth();
  
  // Get the profile to use the correct user ID for wallet users
  const { data: profile } = useProfile(user?.id?.startsWith('0x') ? user.id : undefined);
  const effectiveUserId = user?.id?.startsWith('0x') ? profile?.id : user?.id;
  
  // Enhanced debug logging for series detection
  console.log(`🎯 NFTCard Render: "${nft.name}"`);
  console.log(`   - Type: "${nft.type}"`);
  console.log(`   - SeriesImages: ${nft.seriesImages ? `[${nft.seriesImages.length} images]` : 'undefined'}`);
  console.log(`   - ImageUrl: ${nft.imageUrl ? 'has imageUrl' : 'no imageUrl'}`);
  
  // Check if this is a series with multiple images
  const isSeriesWithImages = nft.type === 'series' && nft.seriesImages && nft.seriesImages.length > 0;
  
  if (isSeriesWithImages) {
    console.log(`🎯 RENDERING SERIES GRID: "${nft.name}" with ${nft.seriesImages.length} images`);
    console.log(`   - Series images:`, nft.seriesImages);
  } else {
    console.log(`🎯 RENDERING SINGLE IMAGE: "${nft.name}"`);
  }

  // Check if current user owns this design
  const isOwner = effectiveUserId && (
    nft.creator === effectiveUserId || 
    (user?.id?.startsWith('0x') && nft.creator === user.id)
  );

  return (
    <div className="group block relative mb-0">
      <Link to={`/nft/${nft.id}`}>
        <div className="relative overflow-hidden transition-opacity hover:opacity-90 border-2 border-black">
          {isSeriesWithImages ? (
            // Series thumbnail grid (2x2 grid for up to 4 images)
            <div className="series-grid-container w-full" style={{ aspectRatio: '1/1' }}>
              <div className="grid grid-cols-2 gap-1 h-full w-full">
                {nft.seriesImages.slice(0, 4).map((imageUrl, index) => (
                  <div key={`series-${nft.id}-${index}`} className="relative overflow-hidden bg-muted/20 aspect-square">
                    <ImageWithFallback
                      src={imageUrl}
                      alt={`${nft.name} image ${index + 1}`}
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                      priority={index === 0}
                      placeholder={true}
                      gridContext={true}
                    />
                  </div>
                ))}
                {/* Fill empty spots if less than 4 images with placeholder */}
                {Array.from({ length: Math.max(0, 4 - nft.seriesImages.length) }).map((_, index) => (
                  <div 
                    key={`empty-${nft.id}-${index}`} 
                    className="bg-muted/30 border border-muted/50 flex items-center justify-center aspect-square"
                  >
                    <div className="w-4 h-4 bg-muted/50 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Single image (for regular designs)
            <ImageWithFallback
              src={nft.imageUrl || '/placeholder.svg'}
              alt={nft.name}
              className="w-full h-auto object-cover transition-transform group-hover:scale-105"
              priority={false}
              placeholder={true}
            />
          )}
        </div>
      </Link>
      
      {/* Hover controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <LikeButton 
            type="design" 
            targetId={nft.id} 
            initialLiked={nft.isLiked}
            initialCount={nft.likeCount}
            size="sm"
          />
          <AddToCollectionButton 
            designId={nft.id}
            size="sm"
            initialSaved={nft.isSaved}
          />
        </div>
        {isOwner && effectiveUserId && (
          <DeleteButton
            designId={nft.id}
            userId={effectiveUserId}
            designName={nft.name}
            size="sm"
          />
        )}
      </div>
    </div>
  );
};

export default NFTCard;
