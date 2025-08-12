import { useState, useEffect } from 'react';
import { History, Settings, HelpCircle, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { Link } from 'react-router-dom';
interface HistoryImage {
  id: string;
  image_url: string;
  name: string;
  created_at: string;
  prompt?: string;
}
interface CreateSidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}
export const CreateSidebar = ({
  isExpanded,
  onToggle
}: CreateSidebarProps) => {
  const [historyImages, setHistoryImages] = useState<HistoryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const {
    isSignedIn,
    user
  } = useSecureAuth();
  useEffect(() => {
    if (isSignedIn && isExpanded) {
      fetchImageHistory();
    }
  }, [isSignedIn, isExpanded]);
  const fetchImageHistory = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      // This would typically fetch from your designs/images API
      // For now, we'll use mock data
      const mockHistory: HistoryImage[] = [{
        id: '1',
        image_url: '/placeholder.svg',
        name: 'Abstract Art',
        created_at: new Date().toISOString(),
        prompt: 'Abstract colorful digital art'
      }, {
        id: '2',
        image_url: '/placeholder.svg',
        name: 'Landscape',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        prompt: 'Beautiful mountain landscape'
      }];
      setHistoryImages(mockHistory);
    } catch (error) {
      console.error('Error fetching image history:', error);
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <div className={`relative bg-background border-r border-border transition-all duration-300 ${isExpanded ? 'w-80' : 'w-12'}`}>
      {/* Header with hamburger menu and search */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0">
          <Menu className="h-4 w-4" />
        </Button>
        
        {isExpanded && <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Search (coming soon)">
            <Search className="h-4 w-4" />
          </Button>}
      </div>

      {/* Sidebar Content */}
      <div className="h-full flex flex-col p-4">
        {isExpanded ? <>
            {/* History Section */}
            <div className="flex flex-col" style={{
          height: 'calc(80vh - 120px)'
        }}>
              <div className="flex items-center gap-2 mb-4">
                <History className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Recent Creations</h3>
              </div>

              <ScrollArea className="flex-1">
                {!isSignedIn ? <div className="text-xs text-muted-foreground text-center py-4 h-full flex items-center justify-center">
                    Sign in to view your creation history
                  </div> : loading ? <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse">
                        <div className="h-16 bg-muted rounded-md mb-2" />
                        <div className="h-3 bg-muted rounded w-3/4 mb-1" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>)}
                  </div> : historyImages.length > 0 ? <div className="space-y-3">
                    {historyImages.map(image => <div key={image.id} className="group cursor-pointer rounded-lg border border-border p-2 hover:bg-accent/50 transition-colors">
                        <div className="flex gap-2">
                          <img src={image.image_url} alt={image.name} className="w-12 h-12 rounded object-cover bg-muted" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium truncate">
                              {image.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(image.created_at)}
                            </p>
                            {image.prompt && <p className="text-xs text-muted-foreground truncate mt-1">
                                {image.prompt}
                              </p>}
                          </div>
                        </div>
                      </div>)}
                  </div> : <div className="text-xs text-muted-foreground text-center py-4 h-full flex items-center justify-center">
                    No creations yet. Start generating!
                  </div>}
              </ScrollArea>
            </div>

            <Separator className="my-4" />

            {/* Settings and Help */}
            <div className="space-y-2">
              <Button variant="ghost" size="sm" asChild className="w-full justify-start h-8 text-xs">
                <Link to="/settings" className="flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  Settings & Privacy
                </Link>
              </Button>
              
              <Button variant="ghost" size="sm" asChild className="w-full justify-start h-8 text-xs">
                
              </Button>
            </div>
          </> :
      // Collapsed state - show icons only
      <div className="flex flex-col h-full">
            <div style={{
          height: 'calc(80vh - 120px)'
        }}></div>
            <div className="mt-6 ml-1">
              <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0" title="Settings">
                <Link to="/settings" className="mx-0 my-[10px] px-0 py-[10px]">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>}
      </div>
    </div>;
};