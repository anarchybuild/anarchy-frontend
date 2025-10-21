import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import FastImageGrid from '@/components/nft/FastImageGrid';
import { useDesigns } from '@/hooks/useQuery';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useQuery';
import { NFTGridSkeleton } from '@/components/common/SkeletonLoader';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useNFTMinting } from '@/hooks/useNFTMinting';
import { createDesign } from '@/services/designService';
import { preloadCriticalImages } from '@/utils/imagePreloader';
import { FloatingPromptBox } from '@/components/layout/FloatingPromptBox';
import WalletButton from '@/components/wallet/WalletButton';
import anarchyLogo from '@/assets/anarchy-logo.svg';
const Index = () => {
  const [prompt, setPrompt] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [generating, setGenerating] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    isSignedIn,
    account,
    loading
  } = useSecureAuth();
  const {
    mintNFT
  } = useNFTMinting();

  // Stabilize wallet detection to prevent re-renders
  const isWalletUser = useMemo(() => user?.id?.startsWith('0x'), [user?.id]);

  // Get the profile to use the correct user ID for wallet users (background loading)
  const {
    data: profile,
    isLoading: profileLoading
  } = useProfile(isWalletUser ? user.id : undefined);

  // Memoize effective user ID to prevent cascading re-renders
  const effectiveUserId = useMemo(() => {
    if (!user?.id) return undefined;
    return isWalletUser ? profile?.id : user?.id;
  }, [user?.id, isWalletUser, profile?.id]);

  // Determine if we should use authenticated query (only when user is fully loaded)
  const shouldUseAuthenticated = useMemo(() => {
    if (!user?.id) return false;
    // For wallet users, wait for profile to load
    if (isWalletUser && profileLoading) return false;
    // For wallet users, need profile ID
    if (isWalletUser && !profile?.id) return false;
    return true;
  }, [user?.id, isWalletUser, profileLoading, profile?.id]);

  // Use single unified hook - either authenticated or public
  const queryUserId = shouldUseAuthenticated ? effectiveUserId : undefined;
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useDesigns(queryUserId);

  // Flatten pages into single array
  const nfts = useMemo(() => data?.pages.flat() || [], [data]);
  if (error) {
    console.error('Error loading designs:', error);
  }

  // Preload critical images when NFTs are first loaded
  useEffect(() => {
    if (nfts.length > 0) {
      const criticalImageUrls = nfts.slice(0, 6).map(nft => {
        // Try thumbnail first, then medium, then main image
        if (nft.thumbnailUrl || (nft as any).thumbnail_url) {
          return nft.thumbnailUrl || (nft as any).thumbnail_url;
        }
        if (nft.mediumUrl || (nft as any).medium_url) {
          return nft.mediumUrl || (nft as any).medium_url;
        }
        return nft.seriesImages && nft.seriesImages.length > 0 ? nft.seriesImages[0] : nft.imageUrl;
      }).filter(Boolean);
      preloadCriticalImages(criticalImageUrls, 6);
    }
  }, [nfts.length > 0]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing prompt",
        description: "Please enter a prompt to generate an image.",
        variant: "destructive"
      });
      return;
    }
    if (!isSignedIn || !account) {
      toast({
        title: "Authentication required",
        description: "Please connect your wallet to generate and mint NFTs.",
        variant: "destructive"
      });
      return;
    }
    setGenerating(true);
    try {
      // Generate the image using the same API as the create page
      const response = await fetch('https://kzkdzvavqjdtomeqwlxn.supabase.co/functions/v1/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6a2R6dmF2cWpkdG9tZXF3bHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4OTY4NDgsImV4cCI6MjA1MjQ3Mjg0OH0.Y-h2taL-CQaF1WkOP_Dh9_ArOZH0CQTXgx-IpsvnGzg`
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: 'flux',
          width: 1024,
          height: 1024
        })
      });
      const data = await response.json();
      if (data.success && data.imageUrl) {
        // Create design
        const name = formData.name.trim() || 'Untitled Design';
        const description = formData.description.trim() || prompt.trim();
        const designData = {
          name,
          description,
          image_url: data.imageUrl,
          price: null,
          license: null,
          private: false,
          series_id: null
        };
        const createdDesign = await createDesign(designData, account.address);
        if (createdDesign) {
          // Mint NFT using gasless minting
          await mintNFT({
            name,
            description,
            imageUrl: data.imageUrl,
            creator: account.address
          });
          toast({
            title: "Success!",
            description: "Image generated and NFT minted successfully!"
          });

          // Reset form
          setFormData({
            name: '',
            description: ''
          });
        } else {
          throw new Error('Failed to create design');
        }
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };
  // Show landing page for non-authenticated users
  if (!loading && !isSignedIn && !showExplore) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-8 max-w-2xl mx-auto px-4">
          <img src={anarchyLogo} alt="Anarchy Logo" className="mx-auto h-12 w-auto" />
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">Create unlimited AI images, for free</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <WalletButton />
            <Button variant="outline" size="lg" onClick={() => {
            console.log('Explore button clicked, setting showExplore to true');
            setShowExplore(true);
          }}>
              Explore
            </Button>
          </div>
        </div>
      </div>;
  }

  // Show explore feed (for both signed in users and non-signed in users who clicked explore)
  return <div className="min-h-screen relative">
      <FastImageGrid nfts={nfts} loading={isLoading} hasNextPage={hasNextPage} fetchNextPage={fetchNextPage} isFetchingNextPage={isFetchingNextPage} />
      
      {isSignedIn && <FloatingPromptBox />}
    </div>;
};
export default Index;