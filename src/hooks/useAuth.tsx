
import { useState, useEffect, useMemo } from 'react';
import { useActiveAccount, useActiveWallet } from 'thirdweb/react';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const account = useActiveAccount();
  const wallet = useActiveWallet();

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener for Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event, session?.user?.id);
      setIsSignedIn(!!session);
      setUser(session?.user || null);
      setLoading(false);
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Current session:', session?.user?.id);
      setIsSignedIn(!!session);
      setUser(session?.user || null);
      setLoading(false);
    });
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Priority: Supabase auth first, then wallet connection
  // Only consider wallet if no Supabase user is signed in
  const isConnected = !!account;
  const finalIsSignedIn = isSignedIn || (!isSignedIn && isConnected);
  const finalUser = useMemo(() => {
    return user || (account && !user ? { id: account.address, email: account.address } : null);
  }, [user, account]);


  return { 
    isSignedIn: finalIsSignedIn, 
    user: finalUser, 
    loading,
    account,
    wallet,
    isSupabaseUser: !!user,
    isWalletUser: !user && !!account
  };
};
