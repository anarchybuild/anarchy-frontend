import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { NFT, Comment } from '@/types/nft';
import { fetchDesignById } from '@/services/designService';
import { fetchCommentsByDesignId } from '@/services/commentService';
import CommentSection from '@/components/nft/CommentSection';
import StickyCommentInput from '@/components/nft/StickyCommentInput';
import LikeButton from '@/components/nft/LikeButton';
import AddToCollectionButton from '@/components/collections/AddToCollectionButton';
import SeriesImageGrid from '@/components/nft/SeriesImageGrid';
import { ArrowLeft, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useQuery';
import DesignOptionsMenu from '@/components/nft/DesignOptionsMenu';

const NFTDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [nft, setNft] = useState<NFT | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Get the profile to use the correct user ID for wallet users
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id?.startsWith('0x') ? user.id : undefined);
  const effectiveUserId = user?.id?.startsWith('0x') ? profile?.id : user?.id;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (id) {
          // Wait for profile to load if it's a wallet user
          if (user?.id?.startsWith('0x') && profileLoading) {
            return;
          }
          
          const [nftData, commentsData] = await Promise.all([
            fetchDesignById(id, effectiveUserId),
            fetchCommentsByDesignId(id),
          ]);
          
          setNft(nftData);
          setComments(commentsData);
        }
      } catch (error) {
        console.error('Error loading design details:', error);
        toast({
          title: "Failed to load design",
          description: "There was an error loading the design details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, effectiveUserId, profileLoading, toast]);

  const handlePurchase = async () => {
    if (!nft) return;
    
    setPurchaseLoading(true);
    try {
      // Simulate purchase transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // This is where you would integrate with the Moonbeam sale contract
      console.log("Purchasing design with ID:", nft.id);
      
      toast({
        title: "Purchase successful!",
        description: `You've successfully purchased "${nft.name}" for ${nft.price} GLMR.`,
      });
      
    } catch (error) {
      console.error("Error purchasing design:", error);
      toast({
        title: "Purchase failed",
        description: "There was an error completing the purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 px-4 md:px-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted rounded"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
              <div className="h-12 bg-muted rounded w-1/3 mt-6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="container py-8 px-4 md:px-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">Design Not Found</h2>
          <p className="text-muted-foreground mb-6">The design you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 md:px-6 max-w-6xl mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-6 hover:bg-transparent p-0 h-auto flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Explore</span>
      </Button>

      {/* Design Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Design/Series Image */}
        <div className="relative border border-border rounded-lg overflow-hidden bg-card">
          {nft.type === 'series' && nft.seriesImages && nft.seriesImages.length > 0 ? (
            // Series - show grid of all images
            <div className="p-4">
              <SeriesImageGrid 
                images={nft.seriesImages} 
                seriesName={nft.name}
              />
            </div>
          ) : (
            // Single image view with enlarge option
            <div className="group relative">
              <img
                src={nft.imageUrl}
                alt={nft.name}
                className="w-full h-auto object-cover"
              />
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-black/90">
                  <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
                    <img
                      src={nft.imageUrl}
                      alt={nft.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Design Info */}
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{nft.name}</h1>
              <p className="text-muted-foreground mt-2">Design ID: {nft.tokenId}</p>
            </div>
            <DesignOptionsMenu 
              designId={nft.id} 
              userId={effectiveUserId || ''} 
              designName={nft.name} 
              isOwner={effectiveUserId === nft.userId} 
            />
          </div>

          <div>
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Creator</p>
                <Link 
                  to={`/user/${nft.creator}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {nft.creator}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <Link 
                  to={`/user/${nft.owner}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {nft.owner}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{new Date(nft.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-muted-foreground">{nft.description}</p>
          </div>

          <div className="flex items-center gap-4">
            <LikeButton 
              type="design" 
              targetId={nft.id} 
              initialLiked={nft.isLiked}
              initialCount={nft.likeCount}
            />
            <AddToCollectionButton 
              designId={nft.id} 
              initialSaved={nft.isSaved}
            />
          </div>

          {nft.isForSale && (
            <div className="pt-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="text-3xl font-bold">{nft.price} GLMR</p>
                </div>
                <Button 
                  onClick={handlePurchase} 
                  disabled={purchaseLoading} 
                  className="btn-anarchy px-8 py-6"
                >
                  {purchaseLoading ? 'Processing...' : 'Purchase Design'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Comments Section */}
      <CommentSection nftId={nft.id} comments={comments} onCommentAdded={() => {
        // Refresh comments when a new one is added
        if (id) {
          fetchCommentsByDesignId(id).then(setComments);
        }
      }} />

      {/* Sticky Comment Input */}
      <StickyCommentInput nftId={nft.id} onCommentAdded={() => {
        // Refresh comments when a new one is added
        if (id) {
          fetchCommentsByDesignId(id).then(setComments);
        }
      }} />
    </div>
  );
};

export default NFTDetail;
