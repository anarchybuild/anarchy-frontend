import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bookmark, Plus, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { getUserCollections, addDesignToCollection, createCollection } from '@/services/collectionService';
import { Collection } from '@/types/collection';
import { getProfileByWallet } from '@/services/profileService';
import { ConnectEmbed } from 'thirdweb/react';
import { client } from '@/config/thirdweb';
import { wallets } from '@/config/wallets';

interface AddToCollectionButtonProps {
  designId: string;
  size?: 'sm' | 'default';
  initialSaved?: boolean;
  onSaveChange?: (saved: boolean) => void;
}

const AddToCollectionButton = ({ 
  designId, 
  size = 'default', 
  initialSaved = false, 
  onSaveChange 
}: AddToCollectionButtonProps) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [showConnect, setShowConnect] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCollections = useCallback(async () => {
    if (!user) {
      console.log('No user found, returning early');
      return;
    }

    console.log('Fetching collections for user:', user);
    setLoading(true);
    try {
      // Get the correct user ID - if it's a wallet user, get the profile ID
      let userId = user.id;
      console.log('Initial userId:', userId);
      
      if (user.id.startsWith('0x')) {
        console.log('Wallet user detected, looking up profile...');
        const profile = await getProfileByWallet(user.id);
        console.log('Profile found:', profile);
        
        if (!profile) {
          console.log('No profile found for wallet address');
          setLoading(false);
          toast({
            title: "Profile not found",
            description: "You need to create a profile first. Please go to your profile page to set up your account.",
            variant: "destructive",
          });
          return;
        }
        userId = profile.id;
        console.log('Using profile userId:', userId);
      }

      console.log('About to call getUserCollections with userId:', userId);
      const userCollections = await getUserCollections(userId);
      console.log('Collections fetched successfully:', userCollections);
      setCollections(userCollections);
      
      // Remove the toast for empty collections - we'll handle this in the UI now
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast({
        title: "Error loading collections",
        description: "Failed to load your collections. Please try again.",
        variant: "destructive"
      });
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  }, [user, toast]);

  // Sync the saved state when initialSaved prop changes
  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  useEffect(() => {
    if (open && user) {
      fetchCollections();
    }
  }, [open, user?.id, fetchCollections]);

  // Close connect modal once user is authenticated
  useEffect(() => {
    if (showConnect && user) {
      setShowConnect(false);
    }
  }, [showConnect, user]);

  const handleAddToCollection = async (collectionId: string, collectionName: string) => {
    try {
      await addDesignToCollection(collectionId, designId);
      
      setIsSaved(true);
      onSaveChange?.(true);
      
      toast({
        title: "Added to collection",
        description: `Design added to "${collectionName}" successfully`
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Error adding to collection:', error);
      toast({
        title: "Error adding to collection",
        description: "This design might already be in that collection.",
        variant: "destructive"
      });
    }
  };

  const handleCreateCollection = async (name: string) => {
    if (!user) return;

    setCreating(true);
    try {
      // Get the correct user ID for wallet users
      let userId = user.id;
      if (user.id.startsWith('0x')) {
        const profile = await getProfileByWallet(user.id);
        if (!profile) {
          toast({
            title: "Profile not found",
            description: "You need to create a profile first.",
            variant: "destructive",
          });
          return;
        }
        userId = profile.id;
      }

      const newCollection = await createCollection(name, '', userId);
      
      // Add the design to the new collection immediately
      await addDesignToCollection(newCollection.id, designId);
      
      toast({
        title: "Collection created and design added",
        description: `Created "${name}" and added this design to it.`
      });
      
      setOpen(false);
      // Refresh collections list
      await fetchCollections();
    } catch (error) {
      console.error('Error creating collection:', error);
      toast({
        title: "Error creating collection",
        description: "Failed to create collection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <>
        <Button
          variant="ghost"
          size={size}
          onClick={() => setShowConnect(true)}
          className="flex items-center gap-2"
        >
          <Bookmark className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />
          {size !== 'sm' && "Save"}
        </Button>

        <Dialog open={showConnect} onOpenChange={setShowConnect}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Sign in to continue</DialogTitle>
            </DialogHeader>
            <ConnectEmbed
              client={client}
              wallets={wallets}
              theme="dark"
              termsOfServiceUrl="/terms"
              privacyPolicyUrl="/privacy"
              showThirdwebBranding={false}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className="flex items-center gap-2"
        >
          <Bookmark className={cn(
            size === 'sm' ? "h-3 w-3" : "h-4 w-4",
            isSaved ? "fill-blue-500 text-blue-500" : "text-muted-foreground"
          )} />
          {size !== 'sm' && (
            <span className={cn(
              isSaved ? "text-blue-500" : "text-muted-foreground"
            )}>
              Save
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {loading ? (
          <DropdownMenuItem disabled>
            Loading collections...
          </DropdownMenuItem>
        ) : (
          <>
            {collections.length > 0 && (
              <>
                {collections.map((collection) => (
                  <DropdownMenuItem
                    key={collection.id}
                    onClick={() => handleAddToCollection(collection.id, collection.name)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    {collection.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => {
                const name = prompt("Enter collection name:");
                if (name?.trim()) {
                  handleCreateCollection(name.trim());
                }
              }}
              className="flex items-center gap-2 cursor-pointer"
              disabled={creating}
            >
              <FolderPlus className="h-4 w-4" />
              {creating ? "Creating..." : "Create New Collection"}
            </DropdownMenuItem>
            {collections.length === 0 && (
              <div className="px-2 py-1 text-xs text-muted-foreground">
                Create your first collection to organize designs
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddToCollectionButton;