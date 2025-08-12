
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  token_id?: string;
  owner?: string;
  token_standard?: string;
  token_uri?: string;
  media?: {
    type: string;
    url: string;
  };
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface AllowlistProof {
  proof: string[];
  quantityLimitPerWallet: string;
  pricePerToken: string;
  currency: string;
}

export interface ClaimResult {
  transactionHash: string;
  metadataUri: string;
  imageUri: string;
  contractAddress: string;
  tokenId?: string;
}

// Keep MintResult for backward compatibility
export interface MintResult extends ClaimResult {}

export interface TransactionResult {
  transactionHash: string;
  contractAddress: string;
  tokenId?: string;
}

export interface DesignData {
  name: string;
  description: string;
  imageUrl: string;
  creator: string;
  license?: string;
  tokenId?: string;
  owner?: string;
}
