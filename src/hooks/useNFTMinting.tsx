
import { useState } from 'react';
import { useActiveAccount, useSwitchActiveWalletChain, useActiveWalletChain } from 'thirdweb/react';
import { useToast } from '@/hooks/use-toast';
import { claimNFTWithThirdweb, createNFTMetadata } from '@/services/thirdwebNFTService';
import { moonbeam } from '@/config/thirdweb';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from './useSecureAuth';
import { createWalletProfile } from '@/services/profileService';

interface ClaimNFTParams {
  name: string;
  description: string;
  imageUrl: string;
  creator: string;
  license?: string;
}

// Backward compatibility
interface MintNFTParams extends ClaimNFTParams {}

export const useNFTMinting = () => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimingStatus, setClaimingStatus] = useState<string>('');
  
  // Backward compatibility
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<string>('');
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const { toast } = useToast();
  const { user, authToken, requireWalletAuth } = useSecureAuth();

  const ensureCorrectChain = async (): Promise<boolean> => {
    if (!account) return false;
    
    try {
      // Check if we're already on Moonbeam
      if (activeChain?.id === moonbeam.id) {
        return true;
      }
      
      setClaimingStatus('Switching to Moonbeam...');
      setMintingStatus('Switching to Moonbeam...');
      console.log("Switching to Moonbeam chain...");
      
      await switchChain(moonbeam);
      
      console.log("Successfully switched to Moonbeam");
      return true;
      
    } catch (error: any) {
      console.error("Failed to switch chain:", error);
      
      if (error.code === 4902) {
        toast({
          title: "Network not found",
          description: "Please add Moonbeam network to your wallet manually",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Chain Switch Failed",
          description: "Please manually switch to Moonbeam network in your wallet",
          variant: "destructive"
        });
      }
      
      return false;
    }
  };

  const getUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();
      
      return profile?.username || null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const claimNFT = async (params: ClaimNFTParams) => {
    console.log("🚀 gasless claimNFT called with params:", params);
    console.log("🔍 Authentication state:", { 
      hasUser: !!user, 
      hasAccount: !!account, 
      userType: user ? 'supabase' : (account ? 'wallet' : 'none'),
      userEmail: user?.email,
      accountAddress: account?.address
    });

    // Check if user is authenticated (either Supabase or wallet)
    if (!user && !account) {
      console.log("❌ No authentication - no user and no account");
      toast({
        title: "Authentication Required",
        description: "Please sign in or connect your wallet to mint NFTs.",
        variant: "destructive",
      });
      return;
    }

    if (!account) {
      console.log("❌ No wallet connected");
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to mint NFTs.",
        variant: "destructive",
      });
      return;
    }

    // For wallet users (no Supabase user but has connected account), try to get or create a profile first
    if (!user && account) {
      console.log("🔄 Wallet user detected - ensuring profile exists...");
      try {
        // Auto-create or get profile for wallet users
        const profileResult = await createWalletProfile(account.address);
        if (!profileResult.success) {
          console.error("❌ Failed to create/get wallet profile:", profileResult.error);
          toast({
            title: "Profile Setup Failed", 
            description: "Unable to set up user profile. Please try again.",
            variant: "destructive",
          });
          return;
        }
        console.log("✅ Wallet profile ready:", profileResult.profile);
      } catch (error) {
        console.error("❌ Profile setup error:", error);
        toast({
          title: "Setup Error",
          description: "Failed to prepare user account. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      console.log("🔄 Starting gasless claim process...");
      setIsClaiming(true);
      setIsMinting(true);
      
      setClaimingStatus('Preparing NFT data...');
      setMintingStatus('Preparing NFT data...');

      // Get current user and their profile for creator name
      const { data: { user } } = await supabase.auth.getUser();
      let creatorName = 'Anonymous'; // Default creator name
      
      if (user) {
        const username = await getUserProfile(user.id);
        // Use username if available, otherwise use 'Anonymous'
        creatorName = username || 'Anonymous';
      }
      
      setClaimingStatus('Minting NFT (gasless)...');
      setMintingStatus('Minting NFT (gasless)...');

      console.log("🔗 Calling gasless-mint edge function with:", {
        name: params.name,
        description: params.description,
        imageUrl: params.imageUrl,
        creator: creatorName,
        userAddress: account?.address,
        hasAuthToken: !!authToken
      });

      // Call the gasless mint edge function
      const { data, error } = await supabase.functions.invoke('gasless-mint', {
        body: {
          name: params.name,
          description: params.description,
          imageUrl: params.imageUrl,
          creator: creatorName,
          license: params.license,
          userAddress: account?.address // Pass user's wallet address
        },
        headers: authToken ? {
          Authorization: `Bearer ${authToken}`
        } : {}
      });

      console.log("📡 Edge function response:", { data, error });

      if (error) {
        throw new Error(error.message || 'Failed to mint NFT');
      }

      if (!data.success) {
        throw new Error(data.error || 'Minting failed');
      }

      toast({
        title: "NFT Minted Successfully!",
        description: `Your design has been minted as NFT (gasless)`,
      });

      setClaimingStatus('');
      setMintingStatus('');
      
      return {
        transactionHash: data.transactionHash,
        metadataUri: data.metadataUri,
        imageUri: data.imageUri,
        contractAddress: data.contractAddress,
        tokenId: data.tokenId
      };

    } catch (error: any) {
      console.error('❌ Error claiming NFT gasless:', error);
      
      // More specific error messages
      let errorMessage = "Failed to mint NFT. Please try again.";
      if (error.message?.includes('Authentication')) {
        errorMessage = "Authentication required. Please connect your wallet and sign in.";
      } else if (error.message?.includes('gasless-mint')) {
        errorMessage = "Minting service unavailable. Please try again later.";
      } else if (error.message?.includes('network')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      toast({
        title: "Minting Failed",
        description: error.message || errorMessage,
        variant: "destructive"
      });
      setClaimingStatus('');
      setMintingStatus('');
      return null;
    } finally {
      setIsClaiming(false);
      setIsMinting(false);
    }
  };

  // Backward compatibility
  const mintNFT = claimNFT;

  return {
    claimNFT,
    isClaiming,
    claimingStatus,
    // Backward compatibility
    mintNFT,
    isMinting,
    mintingStatus,
    isConnected: !!account,
    isCorrectChain: activeChain?.id === moonbeam.id,
  };
};
