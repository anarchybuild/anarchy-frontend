import { supabase } from '@/integrations/supabase/client';
import { createWalletProfile } from './profileService';

// Temporary types until migration completes
interface Series {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface SeriesImage {
  id: string;
  series_id: string;
  image_url: string;
  order_index: number;
  is_selected: boolean;
  created_at: string;
}

interface CreateSeriesData {
  name: string;
  description?: string;
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
}

interface UpdateSeriesData {
  name?: string;
  description?: string;
  is_published?: boolean;
}

export const createSeries = async (
  seriesData: CreateSeriesData,
  walletAddress?: string
): Promise<Series> => {
  console.log('🎬 Creating series with data:', seriesData);
  console.log('🔑 Wallet address provided:', walletAddress);

  let userId: string;

  // First try to get authenticated Supabase user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    console.log('✅ Found Supabase authenticated user:', user.id);
    userId = user.id;
  } else if (walletAddress) {
    console.log('🔗 No Supabase user, using wallet address for profile:', walletAddress);
    
    // Create or get wallet profile
    const profileResult = await createWalletProfile(walletAddress);
    
    if (!profileResult.success) {
      console.error('❌ Failed to create/get wallet profile:', profileResult.error);
      throw new Error(`Failed to set up user profile: ${profileResult.error}`);
    }
    
    userId = profileResult.profile.id;
    console.log('✅ Using profile ID as user ID:', userId);
    
    // Wait a moment to ensure profile is fully committed to database
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify the profile exists before proceeding
    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (!profileCheck) {
      console.error('❌ Profile verification failed after creation');
      throw new Error('Profile creation verification failed. Please try again.');
    }
    
    console.log('✅ Profile verified in database:', profileCheck.id);
  } else {
    console.error('❌ No authentication method available');
    throw new Error('User must be authenticated to create a series');
  }

  const insertData = {
    user_id: userId,
    name: seriesData.name.trim(),
    description: seriesData.description?.trim() || null,
    prompt: seriesData.prompt.trim(),
    model: seriesData.model || null,
    width: seriesData.width || 1024,
    height: seriesData.height || 1024,
    is_published: false,
  };

  console.log('📝 Inserting series data:', insertData);

  const { data, error } = await supabase
    .from('series' as any)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating series:', error);
    console.error('❌ Full error details:', JSON.stringify(error, null, 2));
    console.error('❌ Insert data was:', JSON.stringify(insertData, null, 2));
    
    // If it's an RLS error, provide more context
    if (error.message.includes('row-level security policy')) {
      console.error('❌ RLS Policy violation detected');
      console.error('❌ User ID attempting insert:', userId);
      console.error('❌ Auth UID:', (await supabase.auth.getUser()).data.user?.id);
      
      // Check if profile exists for debugging
      const { data: profileExists } = await supabase
        .from('profiles')
        .select('id, wallet_address')
        .eq('id', userId)
        .single();
      
      console.error('❌ Profile check result:', profileExists);
      
      // Add retry logic for RLS issues
      console.log('🔄 Retrying series creation in 500ms...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: retryData, error: retryError } = await supabase
        .from('series' as any)
        .insert(insertData)
        .select()
        .single();
      
      if (retryError) {
        console.error('❌ Retry also failed:', retryError);
        throw new Error(`Series creation failed after retry. Please check your authentication status and try again.`);
      }
      
      console.log('✅ Series created successfully on retry:', retryData);
      return retryData as unknown as Series;
    }
    
    throw new Error(`Failed to create series: ${error.message}`);
  }

  console.log('✅ Series created successfully:', data);
  return data as unknown as Series;
};

export const addImageToSeries = async (
  seriesId: string,
  imageUrl: string,
  orderIndex: number,
  isSelected: boolean = true
): Promise<SeriesImage> => {
  console.log('🖼️ Adding image to series:', { seriesId, imageUrl, orderIndex, isSelected });

  const insertData = {
    series_id: seriesId,
    image_url: imageUrl,
    order_index: orderIndex,
    is_selected: isSelected,
  };

  const { data, error } = await supabase
    .from('series_images' as any)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ Error adding image to series:', error);
    throw new Error(`Failed to add image to series: ${error.message}`);
  }

  console.log('✅ Image added to series successfully:', data);
  return data as unknown as SeriesImage;
};

export const updateSeriesImageSelection = async (
  imageId: string,
  isSelected: boolean
): Promise<void> => {
  console.log('🔄 Updating image selection:', { imageId, isSelected });

  const { error } = await supabase
    .from('series_images' as any)
    .update({ is_selected: isSelected })
    .eq('id', imageId);

  if (error) {
    console.error('❌ Error updating image selection:', error);
    throw new Error(`Failed to update image selection: ${error.message}`);
  }

  console.log('✅ Image selection updated successfully');
};

export const publishSeries = async (seriesId: string): Promise<void> => {
  console.log('📢 Publishing series:', seriesId);

  const { error } = await supabase
    .from('series' as any)
    .update({ is_published: true })
    .eq('id', seriesId);

  if (error) {
    console.error('❌ Error publishing series:', error);
    throw new Error(`Failed to publish series: ${error.message}`);
  }

  console.log('✅ Series published successfully');
};

export const fetchSeriesById = async (seriesId: string): Promise<Series | null> => {
  console.log('🔍 Fetching series by ID:', seriesId);

  const { data, error } = await supabase
    .from('series' as any)
    .select('*')
    .eq('id', seriesId)
    .maybeSingle();

  if (error) {
    console.error('❌ Error fetching series:', error);
    throw new Error(`Failed to fetch series: ${error.message}`);
  }

  return data as unknown as Series | null;
};

export const fetchSeriesImages = async (seriesId: string): Promise<SeriesImage[]> => {
  console.log('🖼️ Fetching images for series:', seriesId);

  const { data, error } = await supabase
    .from('series_images' as any)
    .select('*')
    .eq('series_id', seriesId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('❌ Error fetching series images:', error);
    throw new Error(`Failed to fetch series images: ${error.message}`);
  }

  return (data as unknown as SeriesImage[]) || [];
};

export const updateSeries = async (
  seriesId: string,
  updateData: UpdateSeriesData
): Promise<Series> => {
  console.log('🔄 Updating series:', { seriesId, updateData });

  const { data, error } = await supabase
    .from('series' as any)
    .update(updateData)
    .eq('id', seriesId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating series:', error);
    throw new Error(`Failed to update series: ${error.message}`);
  }

  console.log('✅ Series updated successfully:', data);
  return data as unknown as Series;
};

export const deleteSeries = async (seriesId: string): Promise<void> => {
  console.log('🗑️ Deleting series:', seriesId);

  // First delete all series images
  const { error: imagesError } = await supabase
    .from('series_images' as any)
    .delete()
    .eq('series_id', seriesId);

  if (imagesError) {
    console.error('❌ Error deleting series images:', imagesError);
    throw new Error(`Failed to delete series images: ${imagesError.message}`);
  }

  // Then delete the series
  const { error } = await supabase
    .from('series' as any)
    .delete()
    .eq('id', seriesId);

  if (error) {
    console.error('❌ Error deleting series:', error);
    throw new Error(`Failed to delete series: ${error.message}`);
  }

  console.log('✅ Series deleted successfully');
};