
export interface NFT {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  creator: string;
  owner: string;
  price: string;
  isForSale: boolean;
  createdAt: string;
  userId?: string;
  likeCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  // Series-specific properties
  type?: 'design' | 'series';
  seriesImages?: string[]; // Array of image URLs for series thumbnails
}

export interface Comment {
  id: string;
  nftId: string;
  author: string;
  content: string;
  timestamp: string;
  userId?: string;
  avatarUrl?: string;
  parentId?: string | null;
  replies?: Comment[];
  likeCount?: number;
  isLiked?: boolean;
}
