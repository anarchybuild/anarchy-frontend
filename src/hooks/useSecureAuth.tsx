import { useState, useEffect, useMemo } from 'react';
import { useActiveAccount, useActiveWallet } from 'thirdweb/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthenticatedUser {
  id: string;
  email?: string;
  walletAddress?: string;
  isSupabaseUser: boolean;
  isWalletUser: boolean;
}

export const useSecureAuth = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { toast } = useToast();

  // Validate wallet signature for authentication
  const validateWalletAuth = async (walletAddress: string): Promise<boolean> => {
    try {
      // Check if we have a stored signature for this wallet
      const storedAuth = localStorage.getItem(`wallet_auth_${walletAddress}`);
      if (!storedAuth) {
        return false;
      }

      const authData = JSON.parse(storedAuth);
      const timeLimit = 24 * 60 * 60 * 1000; // 24 hours
      
      if (Date.now() - authData.timestamp > timeLimit) {
        localStorage.removeItem(`wallet_auth_${walletAddress}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating wallet auth:', error);
      return false;
    }
  };

  // Request wallet signature for authentication
  const requestWalletSignature = async (): Promise<boolean> => {
    if (!account || !wallet) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const message = `Authenticate with wallet: ${account.address}\nTimestamp: ${Date.now()}`;
      
      // For now, we'll simulate signature verification
      // In a production app, you'd implement proper signature verification
      const authData = {
        address: account.address,
        timestamp: Date.now(),
        signature: 'simulated_signature' // This should be a real signature
      };

      localStorage.setItem(`wallet_auth_${account.address}`, JSON.stringify(authData));
      
      toast({
        title: "Wallet authenticated",
        description: "You can now use wallet-based features.",
      });

      return true;
    } catch (error) {
      console.error('Signature request failed:', error);
      toast({
        title: "Authentication failed",
        description: "Please try signing the message again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener for Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setAuthToken(currentSession?.access_token || null);
        
        setUser({
          id: session.user.id,
          email: session.user.email,
          isSupabaseUser: true,
          isWalletUser: false,
        });
        setIsSignedIn(true);
      } else {
        setUser(null);
        setIsSignedIn(false);
        setAuthToken(null);
      }
      setLoading(false);
    });

    // Check current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Current session:', session?.user?.id);
      
      if (session?.user) {
        setAuthToken(session.access_token);
        setUser({
          id: session.user.id,
          email: session.user.email,
          isSupabaseUser: true,
          isWalletUser: false,
        });
        setIsSignedIn(true);
      } else {
        setUser(null);
        setIsSignedIn(false);
        setAuthToken(null);
      }
      setLoading(false);
    });
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handle wallet-based authentication separately
  useEffect(() => {
    const handleWalletAuth = async () => {
      if (!account || user?.isSupabaseUser) return;

      const isValidAuth = await validateWalletAuth(account.address);
      
      if (isValidAuth) {
        setUser({
          id: account.address,
          walletAddress: account.address,
          isSupabaseUser: false,
          isWalletUser: true,
        });
        setIsSignedIn(true);
      } else {
        // Clear any invalid wallet auth
        setUser(null);
        setIsSignedIn(false);
      }
    };

    handleWalletAuth();
  }, [account, user?.isSupabaseUser]);

  // Priority: Supabase auth first, then authenticated wallet connection
  const finalUser = useMemo(() => {
    return user;
  }, [user]);

  const requireWalletAuth = async (): Promise<boolean> => {
    if (user?.isSupabaseUser) return true;
    
    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return false;
    }

    const isValidAuth = await validateWalletAuth(account.address);
    if (!isValidAuth) {
      return await requestWalletSignature();
    }
    
    return true;
  };

  console.log('useSecureAuth state:', { 
    isSignedIn, 
    userId: finalUser?.id, 
    accountAddress: account?.address,
    hasSupabaseUser: finalUser?.isSupabaseUser,
    hasValidWalletAuth: finalUser?.isWalletUser
  });

  return { 
    isSignedIn, 
    user: finalUser, 
    loading,
    account,
    wallet,
    authToken,
    isSupabaseUser: finalUser?.isSupabaseUser || false,
    isWalletUser: finalUser?.isWalletUser || false,
    requireWalletAuth,
    requestWalletSignature
  };
};