import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useActiveAccount, useDisconnect, useActiveWallet } from 'thirdweb/react';
import WalletButton from '@/components/wallet/WalletButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { createWalletProfile } from '@/services/profileService';


import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import ProfileButton from './ProfileButton';
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const account = useActiveAccount();
  const {
    disconnect
  } = useDisconnect();
  const wallet = useActiveWallet();

  // Handle wallet connection and profile setup
  useEffect(() => {
    if (account) {
      console.log('Header: Wallet connected, handling profile setup:', account.address);
      handleWalletConnection();
    }
  }, [account]);
  const handleWalletConnection = async () => {
    if (!account) return;
    try {
      console.log('Header: Checking profile for wallet:', account.address);
      const result = await createWalletProfile(account.address);
      if (result.success) {
        if (result.isNewProfile) {
          console.log('Header: New profile created, navigating to set-username');
          navigate('/set-username');
        } else if (!result.profile?.username_set) {
          console.log('Header: Profile exists but username not set, navigating to set-username');
          navigate('/set-username');
        } else {
          console.log('Header: Profile exists and username is set');
        }
      } else {
        console.error('Header: Error handling wallet connection:', result.error);
        toast({
          title: "Connection error",
          description: result.error || "Failed to set up your profile. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error handling wallet connection:', error);
      toast({
        title: "Connection error",
        description: "Failed to set up your profile. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleSignOut = async () => {
    try {
      setIsLoading(true);

      // Disconnect wallet if connected
      if (account && wallet && disconnect) {
        await disconnect(wallet);
      }
      toast({
        title: "Signed out",
        description: "You have been signed out successfully"
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign out failed",
        description: error.message || "Could not sign out",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const isConnected = !!account;
  return <header className="border-b border-border sticky top-0 z-50 w-full backdrop-blur-sm bg-background/80">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <img src="/lovable-uploads/0df3c4b8-8840-476a-a8ec-c508d91c75ca.png" alt="Anarchy Logo" className="h-8 w-auto" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="hidden md:flex">
            <Link to="/">Explore</Link>
          </Button>
          <Button variant="outline" asChild className="hidden md:flex">
            <Link to="/remix">Remix</Link>
          </Button>
          
          {/* Wallet button outside dropdown for proper modal handling */}
          {!isConnected && (
            <div className="hidden md:block">
              <WalletButton />
            </div>
          )}
          
          {isConnected ? (
            <>
              <ProfileButton />
              <NotificationBell />
            </>
          ) : null}

          {/* Three dots dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isConnected && (
                <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {isLoading ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && <div className="md:hidden border-t border-border">
          <div className="flex flex-col space-y-3 p-4 bg-background">
            <Button variant="outline" asChild className="justify-center" onClick={() => setIsMenuOpen(false)}>
              <Link to="/">
                Explore
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-center" onClick={() => setIsMenuOpen(false)}>
              <Link to="/remix">
                Remix
              </Link>
            </Button>
            <WalletButton className="mt-2" />
          </div>
        </div>}
    </header>;
};
export default Header;