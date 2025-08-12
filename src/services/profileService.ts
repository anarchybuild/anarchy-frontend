
import { supabase } from '@/integrations/supabase/client';

export interface ProfileCreateResult {
  success: boolean;
  error?: string;
  profile?: any;
  isNewProfile?: boolean;
}

export const createWalletProfile = async (walletAddress: string): Promise<ProfileCreateResult> => {
  try {
    console.log('ProfileService: Checking for existing profile with wallet:', walletAddress);
    
    // Check if profile already exists for this wallet address
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (checkError) {
      console.error('ProfileService: Error checking existing profile:', checkError);
      return { 
        success: false, 
        error: 'Failed to check existing profile' 
      };
    }

    if (existingProfile) {
      console.log('ProfileService: Found existing profile:', existingProfile);
      return { 
        success: true, 
        profile: existingProfile, 
        isNewProfile: false 
      };
    }

    // Create a new profile for the wallet
    const profileId = crypto.randomUUID();
    const defaultUsername = walletAddress.substring(0, 8);
    
    console.log('ProfileService: Creating new profile with ID:', profileId);
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: profileId,
        wallet_address: walletAddress,
        username: defaultUsername,
        username_set: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('ProfileService: Error creating profile:', createError);
      return { 
        success: false, 
        error: 'Failed to create profile: ' + createError.message 
      };
    }

    console.log('ProfileService: Successfully created new profile:', newProfile);
    return { 
      success: true, 
      profile: newProfile, 
      isNewProfile: true 
    };
  } catch (error) {
    console.error('ProfileService: Unexpected error:', error);
    return { 
      success: false, 
      error: 'Unexpected error occurred' 
    };
  }
};

export const getProfileByWallet = async (walletAddress: string) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile by wallet:', error);
    return null;
  }

  return profile;
};
