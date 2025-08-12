
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NFTGrid from '@/components/nft/NFTGrid';
import { NFT } from '@/types/nft';
import { Collection } from '@/types/collection';
import CreateCollectionDialog from '@/components/collections/CreateCollectionDialog';
import CollectionCard from '@/components/collections/CollectionCard';
import { getUserCollections } from '@/services/collectionService';
import { useToast } from '@/components/ui/use-toast';
import { getProfileByWallet } from '@/services/profileService';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserPrivateDesigns } from '@/services/designService';

interface ProfileTabsProps {
  ownedNFTs: NFT[];
  loadingNFTs: boolean;
  profile: any;
  currentUserId?: string;
}

const ProfileTabs = ({ ownedNFTs, loadingNFTs, profile, currentUserId }: ProfileTabsProps) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [privateDesigns, setPrivateDesigns] = useState<NFT[]>([]);
  const [loadingPrivateDesigns, setLoadingPrivateDesigns] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isOwnProfile = currentUserId === profile?.id;

  useEffect(() => {
    if (profile?.id) {
      fetchCollections();
      if (isOwnProfile) {
        fetchPrivateDesigns();
      }
    }
  }, [profile?.id, isOwnProfile]);

  const fetchCollections = async () => {
    if (!profile?.id) return;

    setLoadingCollections(true);
    try {
      const userCollections = await getUserCollections(profile.id);
      setCollections(userCollections);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast({
        title: "Error loading collections",
        description: "Failed to load your collections. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingCollections(false);
    }
  };

  const fetchPrivateDesigns = async () => {
    if (!profile?.id) return;

    setLoadingPrivateDesigns(true);
    try {
      const designs = await fetchUserPrivateDesigns(profile.id);
      setPrivateDesigns(designs);
    } catch (error) {
      console.error('Error fetching private designs:', error);
      toast({
        title: "Error loading private designs",
        description: "Failed to load your private designs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingPrivateDesigns(false);
    }
  };

  const handleCollectionCreated = () => {
    fetchCollections();
  };

  const handleCollectionClick = (collection: Collection) => {
    navigate(`/collection/${collection.id}`);
  };

  return (
    <Tabs defaultValue="designs" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="designs">My Designs</TabsTrigger>
        <TabsTrigger value="collections">Collections</TabsTrigger>
        {isOwnProfile && <TabsTrigger value="private">Private</TabsTrigger>}
      </TabsList>
      
      <TabsContent value="designs">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Your Designs</h2>
          <NFTGrid 
            nfts={ownedNFTs} 
            loading={loadingNFTs}
            emptyMessage="You haven't created any designs yet. Start creating!" 
          />
        </div>
      </TabsContent>
      
      <TabsContent value="collections">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Your Collections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile?.id && (
              <CreateCollectionDialog 
                userId={profile.id}
                onCollectionCreated={handleCollectionCreated}
              />
            )}
            
            {loadingCollections ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">Loading collections...</p>
              </div>
            ) : (
              collections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  onClick={() => handleCollectionClick(collection)}
                />
              ))
            )}
          </div>
        </div>
      </TabsContent>
      
      {isOwnProfile && (
        <TabsContent value="private">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Private Designs</h2>
            <NFTGrid 
              nfts={privateDesigns} 
              loading={loadingPrivateDesigns}
              emptyMessage="You haven't created any private designs yet." 
            />
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
};

export default ProfileTabs;
