
import { NFT, Comment } from '@/types/nft';

// Sample NFT data
export const mockNFTs: NFT[] = [
  {
    id: '1',
    tokenId: '1',
    name: 'Digital Dystopia',
    description: 'A stark vision of a world where technology and chaos intersect. This piece explores themes of anarchy and digital resistance.',
    imageUrl: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&auto=format&fit=crop',
    creator: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    owner: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    price: '45.5',
    isForSale: true,
    createdAt: '2025-04-15T10:30:00Z',
  },
  {
    id: '2',
    tokenId: '2',
    name: 'Order in Chaos',
    description: 'Finding structure within anarchy. A minimalist exploration of chaos theory and emergent order.',
    imageUrl: 'https://images.unsplash.com/photo-1452960962994-acf4fd70b632?w=800&auto=format&fit=crop',
    creator: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    owner: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    price: '12.8',
    isForSale: true,
    createdAt: '2025-04-10T14:20:00Z',
  },
  {
    id: '3',
    tokenId: '3',
    name: 'Decentralized Mind',
    description: 'A visualization of decentralized consciousness. Free from control, the mind expands beyond conventional boundaries.',
    imageUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=800&auto=format&fit=crop',
    creator: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    owner: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    price: '33.2',
    isForSale: false,
    createdAt: '2025-04-05T09:15:00Z',
  },
  {
    id: '4',
    tokenId: '4',
    name: 'Silent Rebellion',
    description: 'The quiet power of personal defiance. This piece represents how small acts of rebellion create ripples of change.',
    imageUrl: 'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=800&auto=format&fit=crop',
    creator: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    owner: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
    price: '21.5',
    isForSale: true,
    createdAt: '2025-03-28T16:45:00Z',
  },
  {
    id: '5',
    tokenId: '5',
    name: 'Fragmented Authority',
    description: 'The dissolution of centralized power. This artwork explores the breaking down of traditional power structures.',
    imageUrl: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=800&auto=format&fit=crop',
    creator: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    owner: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    price: '19.6',
    isForSale: true,
    createdAt: '2025-03-22T11:30:00Z',
  },
  {
    id: '6',
    tokenId: '6',
    name: 'Autonomous Collective',
    description: 'A representation of decentralized community organization. Together but independent, united but free.',
    imageUrl: 'https://images.unsplash.com/photo-1543857778-c4a1a9e0615f?w=800&auto=format&fit=crop',
    creator: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
    owner: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
    price: '28.4',
    isForSale: false,
    createdAt: '2025-03-15T13:10:00Z',
  }
];

// Sample comment data
export const mockComments: Record<string, Comment[]> = {
  '1': [
    {
      id: 'c1',
      nftId: '1',
      author: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
      content: 'The contrast in this piece is stunning. Really captures the tension between order and chaos.',
      timestamp: '2025-05-01T14:30:00Z',
    },
    {
      id: 'c2',
      nftId: '1',
      author: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
      content: 'I love the subtle references to classic cyberpunk aesthetics while maintaining originality.',
      timestamp: '2025-05-02T09:15:00Z',
    },
  ],
  '2': [
    {
      id: 'c3',
      nftId: '2',
      author: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      content: 'Minimalism at its finest. The artist really understands how to communicate complex ideas simply.',
      timestamp: '2025-04-28T16:20:00Z',
    },
  ],
  '4': [
    {
      id: 'c4',
      nftId: '4',
      author: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
      content: "I'm getting strong Banksy vibes from this. Thought-provoking and relevant.",
      timestamp: '2025-05-03T11:45:00Z',
    },
    {
      id: 'c5',
      nftId: '4',
      author: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      content: 'The technical execution is flawless. Would love to see more work from this creator.',
      timestamp: '2025-05-04T13:30:00Z',
    },
    {
      id: 'c6',
      nftId: '4',
      author: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      content: 'This piece speaks to me on multiple levels. A definite statement on our current social climate.',
      timestamp: '2025-05-05T10:20:00Z',
    },
  ],
};

// Mock functions to simulate API calls
export const fetchNFTs = (): Promise<NFT[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockNFTs);
    }, 800); // Simulate network delay
  });
};

export const fetchNFTById = (id: string): Promise<NFT | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const nft = mockNFTs.find(nft => nft.id === id) || null;
      resolve(nft);
    }, 500);
  });
};

export const fetchCommentsByNFTId = (nftId: string): Promise<Comment[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const comments = mockComments[nftId] || [];
      resolve(comments);
    }, 500);
  });
};
