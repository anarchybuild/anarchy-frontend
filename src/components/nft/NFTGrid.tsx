
import { NFT } from '@/types/nft';
import NFTCard from './NFTCard';
import Masonry from 'react-masonry-css';

interface NFTGridProps {
  nfts: NFT[];
  loading?: boolean;
  emptyMessage?: string;
}

const NFTGrid = ({
  nfts,
  loading = false,
  emptyMessage = "No NFTs found"
}: NFTGridProps) => {
  const breakpointColumnsObj = {
    default: 5,
    1536: 5, // xl
    1024: 4, // lg
    768: 3,  // md
    640: 2,  // sm
    0: 1     // default
  };

  // Loading placeholders
  if (loading) {
    return <Masonry
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
      </Masonry>;
  }

  // Empty state
  if (nfts.length === 0) {
    return <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <h3 className="text-lg font-medium mb-2">{emptyMessage}</h3>
      </div>;
  }

  // Masonry grid layout using NFTCard for proper series handling
  return <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto"
      columnClassName="bg-clip-padding"
    >
      {nfts.map(nft => (
        <div key={nft.id} className="mb-0">
          <NFTCard nft={nft} />
        </div>
      ))}
    </Masonry>;
};

export default NFTGrid;
