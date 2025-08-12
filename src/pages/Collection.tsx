import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getCollectionItems, deleteCollection, getCollection } from '@/services/collectionService';
import { ArrowLeft, Trash2 } from 'lucide-react';
import NFTGrid from '@/components/nft/NFTGrid';
import { NFT } from '@/types/nft';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Collection = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (collectionId) {
      fetchCollectionData();
    }
  }, [collectionId]);

  const fetchCollectionData = async () => {
    if (!collectionId) return;

    try {
      setLoading(true);
      
      // Fetch collection details and items in parallel
      const [collectionData, items] = await Promise.all([
        getCollection(collectionId),
        getCollectionItems(collectionId)
      ]);
      
      setCollection(collectionData);
      
      // Transform the data to match NFT interface
      const nftItems: NFT[] = items.map(item => ({
        id: item.id,
        tokenId: item.id,
        name: item.name,
        description: item.description || '',
        imageUrl: item.image_url || '',
        creator: item.user_id,
        owner: item.user_id,
        price: item.price?.toString() || '0',
        isForSale: false,
        createdAt: item.created_at
      }));
      
      setDesigns(nftItems);
    } catch (error) {
      console.error('Error fetching collection data:', error);
      toast({
        title: "Error loading collection",
        description: "Failed to load collection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteCollection = async () => {
    if (!collectionId) return;

    try {
      await deleteCollection(collectionId);
      
      toast({
        title: "Collection deleted",
        description: "Your collection has been deleted successfully"
      });
      
      navigate('/profile');
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast({
        title: "Error deleting collection",
        description: "Failed to delete collection. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-10">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Loading collection...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Button>
          <h1 className="text-3xl font-bold">{collection?.name || 'Collection'}</h1>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Collection
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Collection</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this collection? This action cannot be undone.
                The designs will not be deleted, only removed from this collection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCollection} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <NFTGrid 
        nfts={designs} 
        loading={false}
        emptyMessage="This collection is empty. Add some designs from the explore page!" 
      />
    </div>
  );
};

export default Collection;
