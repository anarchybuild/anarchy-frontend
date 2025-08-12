
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveAccount } from 'thirdweb/react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { validateUsername } from '@/utils/usernameValidation';

const SetUsername = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const account = useActiveAccount();

  useEffect(() => {
    checkUserStatus();
  }, [account]);

  const checkUserStatus = async () => {
    try {
      if (!account) {
        // No wallet connected, redirect to home
        navigate('/');
        return;
      }

      // Check if profile exists and username is set for wallet user
      const { data: profile } = await supabase
        .from('profiles')
        .select('username_set')
        .eq('wallet_address', account.address)
        .maybeSingle();

      if (profile?.username_set) {
        // Username already set, redirect to profile
        navigate('/profile');
        return;
      }

      if (!profile) {
        // No profile exists, this shouldn't happen but redirect to home
        navigate('/');
        return;
      }

      // Profile exists but username not set, stay on this page
    } catch (error) {
      console.error('Error checking user status:', error);
      navigate('/');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    const validation = validateUsername(username);
    if (!validation.isValid) {
      toast({
        title: "Invalid username",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Check if username is available
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        toast({
          title: "Username taken",
          description: "This username is already taken. Please choose another.",
          variant: "destructive"
        });
        return;
      }

      // Update the profile with the new username
      const { error } = await supabase
        .from('profiles')
        .update({ 
          username: username,
          username_set: true 
        })
        .eq('wallet_address', account.address);

      if (error) throw error;

      toast({
        title: "Username set",
        description: "Your username has been set successfully!"
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error setting username:', error);
      toast({
        title: "Error",
        description: "Failed to set username. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="container max-w-md mx-auto py-20">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Checking profile...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container max-w-md mx-auto py-20">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Wallet not connected</CardTitle>
            <CardDescription>Please connect your wallet to continue</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-20">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Choose Your Username</CardTitle>
          <CardDescription>
            Pick a unique username for your profile. You can change this later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="your_username"
                maxLength={15}
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Up to 15 characters. Letters, numbers, and underscores only.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !username}>
              {loading ? 'Setting username...' : 'Set Username'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetUsername;
