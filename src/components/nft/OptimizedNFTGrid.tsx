import React, { memo, useCallback, useRef, useEffect } from 'react';
import { NFT } from '@/types/nft';
import OptimizedNFTCard from './OptimizedNFTCard';
import Masonry from 'react-masonry-css';
import { useIntersection } from '@/hooks/useIntersection';

interface OptimizedNFTGridProps {
  nfts: NFT[];
  loading?: boolean;
  emptyMessage?: string;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
}

const OptimizedNFTGrid = memo(({
  nfts,
  loading = false,
  emptyMessage = "No NFTs found",
  hasNextPage = false,
  fetchNextPage,
  isFetchingNextPage = false
}: OptimizedNFTGridProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Memoize breakpoint configuration
  const breakpointColumnsObj = {
    default: 5,
    1536: 5, // xl
    1024: 4, // lg
    768: 3,  // md
    640: 2,  // sm
    0: 1     // default
  };

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
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto"
        columnClassName="bg-clip-padding"
      >
        {Array(12).fill(0).map((_, index) => 
          <div key={index} className="mb-0">
            <div className="bg-muted animate-pulse border-2 border-black" style={{
              height: `${200 + Math.random() * 200}px`
            }}></div>
          </div>
        )}
      </Masonry>
    );
  }

  // Empty state
  if (nfts.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <h3 className="text-lg font-medium mb-2">{emptyMessage}</h3>
      </div>
    );
  }

  // Main grid with infinite scroll
  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto"
        columnClassName="bg-clip-padding"
      >
      {nfts.map((nft, index) => (
        <div key={nft.id} className="mb-0">
          <OptimizedNFTCard 
            nft={nft} 
            priority={index < 6} 
            preload={index < 2}
          />
        </div>
      ))}
      </Masonry>
      
      {/* Infinite scroll trigger */}
      {(hasNextPage || isFetchingNextPage) && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-muted-foreground">Loading more...</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Scroll for more</div>
          )}
        </div>
      )}
    </>
  );
});

OptimizedNFTGrid.displayName = 'OptimizedNFTGrid';

export default OptimizedNFTGrid;