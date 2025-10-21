import React, { memo, useCallback, useRef, useEffect } from 'react';
import { NFT } from '@/types/nft';
import FastImage from './FastImage';
import { useIntersection } from '@/hooks/useIntersection';
import { Link } from 'react-router-dom';

interface FastImageGridProps {
  nfts: NFT[];
  loading?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
}

const FastImageGrid = memo(({
  nfts,
  loading = false,
  hasNextPage = false,
  fetchNextPage,
  isFetchingNextPage = false
}: FastImageGridProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Intersection observer for infinite scrolling
  const intersection = useIntersection(loadMoreRef, {
    threshold: 0.1,
  });

  // Memoized fetch handler
  const handleFetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Trigger fetch when intersection occurs
  useEffect(() => {
    if (intersection?.isIntersecting) {
      handleFetchMore();
    }
  }, [intersection?.isIntersecting, handleFetchMore]);

  // Loading placeholders
  if (loading && nfts.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 p-1">
        {Array(24).fill(0).map((_, index) => (
          <div key={index} className="aspect-square bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state
  if (nfts.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center min-h-[50vh]">
        <h3 className="text-lg font-medium mb-2 text-muted-foreground">No images found</h3>
      </div>
    );
  }

  return (
    <>
      {/* Fast Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 p-1">
        {nfts.map((nft, index) => {
          // Get the first image from series or the main image
          const imageUrl = nft.seriesImages && nft.seriesImages.length > 0 
            ? nft.seriesImages[0] 
            : nft.imageUrl;

          // Try to get thumbnail URL first for faster loading
          const thumbnailUrl = (nft as any).thumbnailUrl || (nft as any).thumbnail_url || (nft as any).mediumUrl || (nft as any).medium_url;
          
          return (
            <Link 
              key={nft.id} 
              to={`/nft/${nft.id}`}
              className="block hover:opacity-90 transition-opacity duration-150"
            >
              <FastImage
                src={imageUrl}
                thumbnailSrc={thumbnailUrl}
                alt={nft.name}
                priority={index < 18} // Prioritize first 18 images (3 rows)
              />
            </Link>
          );
        })}
      </div>
      
      {/* Infinite scroll trigger */}
      {(hasNextPage || isFetchingNextPage) && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-muted-foreground">Loading more...</span>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
});

FastImageGrid.displayName = 'FastImageGrid';

export default FastImageGrid;