
import { NFTMetadata, ClaimResult, DesignData } from "@/types/thirdweb";
import { uploadImageToAuthenticatedIPFS, uploadMetadataToAuthenticatedIPFS } from "@/services/authenticatedIPFSService";
import { uploadImageToWalletIPFS, uploadMetadataToWalletIPFS } from "@/services/walletIPFSService";
import { prepareAndSendClaimTransaction, handleClaimError } from "@/services/claimService";
import { readContract } from "thirdweb";
import { getContractInstance } from "@/config/thirdweb";
import { supabase } from '@/integrations/supabase/client';

export const createNFTMetadata = (design: DesignData): NFTMetadata => {
  return {
    name: design.name,
    description: design.description,
    image: design.imageUrl,
    external_url: "https://anarchy-platform.com",
    attributes: [
      {
        trait_type: "Creator",
        value: design.creator
      },
      ...(design.license ? [{
        trait_type: "License",
        value: design.license
      }] : []),
      {
        trait_type: "Platform",
        value: "Anarchy"
      }
    ]
  };
};

// Helper function to get the next token ID that will be minted
const getNextTokenId = async (): Promise<string> => {
  try {
    const contract = getContractInstance();
    // Try to get the next token ID - if this method doesn't exist, we'll catch the error
    const nextTokenId = await readContract({
      contract,
      method: "function nextTokenIdToMint() view returns (uint256)",
      params: []
    });
    return nextTokenId.toString();
  } catch (error) {
    console.warn("nextTokenIdToMint method not available in contract, using placeholder:", error);
    return "TBD";
  }
};

export const claimNFTWithThirdweb = async (
  account: any,
  metadata: NFTMetadata
): Promise<ClaimResult> => {
  if (!account) {
    throw new Error("No account connected");
  }

  console.log("🚀 Starting NFT claiming with IPFS storage...");
  console.log("Account:", account.address);
  console.log("Design name:", metadata.name);

  try {
    console.log("🔍 Step 0: Getting next token ID...");
    const tokenId = await getNextTokenId();
    console.log("Predicted token ID:", tokenId);

    // Check if user is authenticated with Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const isSupabaseAuthenticated = !!user;
    
    console.log("🔐 Authentication status:");
    console.log("- Supabase user:", isSupabaseAuthenticated ? user.id : 'None');
    console.log("- Wallet address:", account.address);

    let imageUri: string;
    let metadataUri: string;

    if (isSupabaseAuthenticated) {
      console.log("📤 Using authenticated IPFS upload (Supabase user)...");
      
      console.log("📤 Step 1: Uploading image to authenticated IPFS...");
      imageUri = await uploadImageToAuthenticatedIPFS(metadata.image, metadata.name);
      console.log("✅ Image IPFS URI:", imageUri);

      // Create final metadata with the authenticated IPFS image URI
      const finalMetadata: NFTMetadata = {
        name: metadata.name,
        description: metadata.description,
        image: imageUri,
        external_url: "https://anarchy-platform.com",
        attributes: metadata.attributes || []
      };

      console.log("📤 Step 2: Uploading metadata to authenticated IPFS...");
      metadataUri = await uploadMetadataToAuthenticatedIPFS(finalMetadata);
      console.log("✅ Metadata IPFS URI:", metadataUri);
    } else {
      console.log("📤 Using wallet-based IPFS upload (wallet-only user)...");
      
      console.log("📤 Step 1: Uploading image to wallet IPFS...");
      imageUri = await uploadImageToWalletIPFS(metadata.image, metadata.name);
      console.log("✅ Image IPFS URI:", imageUri);

      // Create final metadata with the wallet IPFS image URI
      const finalMetadata: NFTMetadata = {
        name: metadata.name,
        description: metadata.description,
        image: imageUri,
        external_url: "https://anarchy-platform.com",
        attributes: metadata.attributes || []
      };

      console.log("📤 Step 2: Uploading metadata to wallet IPFS...");
      metadataUri = await uploadMetadataToWalletIPFS(finalMetadata);
      console.log("✅ Metadata IPFS URI:", metadataUri);
    }

    // Validate that we got proper URIs
    if (!imageUri || imageUri.trim() === '') {
      throw new Error("Failed to get valid image URI from IPFS");
    }
    if (!metadataUri || metadataUri.trim() === '') {
      throw new Error("Failed to get valid metadata URI from IPFS");
    }
    
    console.log("💰 Step 3: Claiming NFT...");
    console.log("Final claiming parameters:");
    console.log("- Address:", account.address);
    console.log("- Token URI:", metadataUri);
    console.log("- Image URI:", imageUri);
    console.log("- Upload method:", isSupabaseAuthenticated ? 'Authenticated' : 'Wallet-based');
    console.log("- Contract method: claim");
    
    const transactionResult = await prepareAndSendClaimTransaction(account, metadataUri);

    console.log("🎉 NFT claimed successfully!");
    console.log("Transaction hash:", transactionResult.transactionHash);
    console.log("Image stored at:", imageUri);
    console.log("Metadata stored at:", metadataUri);
    
    return {
      transactionHash: transactionResult.transactionHash,
      contractAddress: transactionResult.contractAddress,
      metadataUri,
      imageUri,
      tokenId: tokenId
    };
  } catch (error) {
    console.error("💥 NFT claiming failed:", error);
    return handleClaimError(error);
  }
};

// Backward compatibility
export const mintNFTWithThirdweb = claimNFTWithThirdweb;
