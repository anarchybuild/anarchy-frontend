import { supabase } from '@/integrations/supabase/client';
import { NFT } from '@/types/nft';
import { createWalletProfile } from './profileService';

export interface Design {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number | null;
  license: string | null;
  private: boolean;
  created_at: string;
  updated_at: string;
}

export const createDesign = async (designData: {
  name: string;
  description: string;
  image_url?: string;
  price?: number;
  license?: string;
  private?: boolean;
  series_id?: string | null;
}, walletAddress?: string) => {
  console.log('🎨 Creating design with data:', designData);
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
  } else {
    console.error('❌ No authentication method available');
    throw new Error('User must be authenticated (either via Supabase or wallet) to create a design');
  }

  // Ensure we have required fields
  if (!designData.name || !designData.description) {
    console.error('❌ Missing required fields:', { name: designData.name, description: designData.description });
    throw new Error('Name and description are required');
  }

  const insertData = {
    user_id: userId,
    name: designData.name.trim(),
    description: designData.description.trim(),
    image_url: designData.image_url || null,
    price: designData.price || null,
    license: designData.license || null,
    private: designData.private || false,
    series_id: designData.series_id || null,
  };

  console.log('📝 Inserting design data:', insertData);

  const { data, error } = await supabase
    .from('designs')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating design:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to create design: ${error.message}`);
  }

  console.log('✅ Design created successfully:', data);
  return data;
};

interface FetchDesignsOptions {
  userId?: string;
  limit?: number;
  offset?: number;
}

export const fetchDesigns = async (options: FetchDesignsOptions = {}): Promise<NFT[]> => {
  const { userId, limit = 20, offset = 0 } = options;
  
  // Fetch only from designs table with pagination
  const { data: designs, error: designsError } = await supabase
    .from('designs')
    .select('*')
    .eq('private', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (designsError) {
    console.error('Error fetching designs:', designsError);
    throw designsError;
  }

  // Get unique series IDs from designs that have series_id
  const seriesIds = [...new Set(designs.filter(d => d.series_id).map(d => d.series_id))];
  console.log('🔍 Fetching images for series IDs:', seriesIds);
  
  // Fetch series images for all series
  const { data: seriesImages } = seriesIds.length > 0 ? await supabase
    .from('series_images')
    .select('series_id, image_url, order_index')
    .in('series_id', seriesIds)
    .eq('is_selected', true)
    .order('order_index', { ascending: true }) : { data: [] };

  console.log('📸 Fetched series images:', seriesImages);

  // Fetch profiles for all user IDs
  const allUserIds = designs.map(design => design.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, name, avatar_url')
    .in('id', allUserIds);

  // Fetch likes for all designs
  const designIds = designs.map(design => design.id);
  const { data: likes } = await supabase
    .from('likes')
    .select('design_id, user_id')
    .in('design_id', designIds);

  // Fetch saved status for current user
  let savedDesigns = new Set();
  if (userId) {
    const { data: collectionItems } = await supabase
      .from('collection_items')
      .select(`
        design_id,
        collections!inner(user_id)
      `)
      .in('design_id', designIds)
      .eq('collections.user_id', userId);

    if (collectionItems) {
      collectionItems.forEach(item => {
        savedDesigns.add(item.design_id);
      });
    }
  }

  // Create a map of user profiles for easy lookup
  const profileMap = new Map();
  if (profiles) {
    profiles.forEach(profile => {
      profileMap.set(profile.id, profile);
    });
  }

  // Create like maps
  const likeCounts = new Map();
  const userLikes = new Set();
  
  if (likes) {
    likes.forEach(like => {
      // Count likes per design
      const count = likeCounts.get(like.design_id) || 0;
      likeCounts.set(like.design_id, count + 1);
      
      // Track which designs the current user has liked
      if (userId && like.user_id === userId) {
        userLikes.add(like.design_id);
      }
    });
  }

  console.log('📊 Likes found:', likes?.length || 0);
  console.log('💾 Saved designs for user:', Array.from(savedDesigns));
  console.log('❤️ User likes:', Array.from(userLikes));

  // Create series images map
  const seriesImagesMap = new Map();
  if (seriesImages) {
    seriesImages.forEach(img => {
      if (!seriesImagesMap.has(img.series_id)) {
        seriesImagesMap.set(img.series_id, []);
      }
      seriesImagesMap.get(img.series_id).push(img.image_url);
    });
  }
  
  console.log('🖼️ Series images map:', seriesImagesMap);

  // Transform designs with profile and like data
  const transformedDesigns = designs.map((design: any) => {
    const profile = profileMap.get(design.user_id);
    const likeCount = likeCounts.get(design.id) || 0;
    const isLiked = userLikes.has(design.id);
    const isSaved = savedDesigns.has(design.id);
    
    // Determine if this is a series based on series_id
    const isSeriesDesign = design.series_id !== null;
    const seriesImages = isSeriesDesign ? seriesImagesMap.get(design.series_id) || [] : [];
    
    console.log(`🎨 Design ${design.id}: ${isSeriesDesign ? 'SERIES' : 'DESIGN'}, likes=${likeCount}, isLiked=${isLiked}, isSaved=${isSaved}`);
    if (isSeriesDesign) {
      console.log(`📸 Series ${design.name} has ${seriesImages.length} images:`, seriesImages);
    }
    
    return {
      id: design.id,
      tokenId: design.id,
      name: design.name,
      description: design.description || '',
      imageUrl: design.image_url || seriesImages[0] || '/placeholder.svg',
      creator: profile?.username || design.user_id,
      owner: profile?.username || design.user_id,
      price: design.price ? design.price.toString() : '0',
      isForSale: design.price !== null,
      createdAt: design.created_at,
      userId: design.user_id,
      likeCount,
      isLiked,
      isSaved,
      type: isSeriesDesign ? 'series' as const : 'design' as const,
      ...(isSeriesDesign && seriesImages.length > 0 && { seriesImages: seriesImages.slice(0, 4) })
    };
  });

  return transformedDesigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const fetchDesignById = async (id: string, userId?: string): Promise<NFT | null> => {
  console.log('Fetching design/series with ID:', id);
  
  // Try to fetch from designs table first
  const { data: design, error: designError } = await supabase
    .from('designs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (designError) {
    console.error('Error fetching design:', designError);
    throw designError;
  }

  if (!design) {
    console.log('No design found with ID:', id);
    return null;
  }

  // Check if this is a series (has series_id)
  let seriesImages: string[] = [];
  if (design.series_id) {
    console.log('This is a series design, fetching series images...');
    const { data: imagesData } = await supabase
      .from('series_images')
      .select('image_url, order_index')
      .eq('series_id', design.series_id)
      .eq('is_selected', true)
      .order('order_index', { ascending: true });
    
    seriesImages = imagesData?.map(img => img.image_url) || [];
    console.log('Series images found:', seriesImages);
  }

  // Fetch the profile and likes separately for design
  const [
    { data: profile, error: profileError },
    { data: likes, error: likesError }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, name, avatar_url')
      .eq('id', design.user_id)
      .maybeSingle(),
    supabase
      .from('likes')
      .select('user_id')
      .eq('design_id', id)
  ]);

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  }

  if (likesError) {
    console.error('Error fetching likes:', likesError);
  }

  // Check if design is saved to any collection by the user
  let isSaved = false;
  if (userId) {
    const { data: collectionItems, error: savedError } = await supabase
      .from('collection_items')
      .select(`
        id,
        collections!inner(user_id)
      `)
      .eq('design_id', id)
      .eq('collections.user_id', userId)
      .limit(1);

    if (!savedError && collectionItems && collectionItems.length > 0) {
      isSaved = true;
    }
  }

  const likeCount = likes?.length || 0;
  const isLiked = userId ? likes?.some(like => like.user_id === userId) || false : false;

  const result: NFT = {
    id: design.id,
    tokenId: design.id,
    name: design.name,
    description: design.description || '',
    imageUrl: design.image_url || seriesImages[0] || '/placeholder.svg',
    creator: profile?.username || design.user_id,
    owner: profile?.username || design.user_id,
    price: design.price ? design.price.toString() : '0',
    isForSale: design.price !== null,
    createdAt: design.created_at,
    userId: design.user_id,
    likeCount,
    isLiked,
    isSaved,
    type: design.series_id ? 'series' : 'design',
    ...(design.series_id && seriesImages.length > 0 && { seriesImages })
  };

  return result;
};

export const fetchUserDesigns = async (userId: string, includePrivate: boolean = false): Promise<NFT[]> => {
  // Fetch both designs and series for the user
  const [
    { data: designs, error: designsError },
    { data: series, error: seriesError }
  ] = await Promise.all([
    // Fetch designs
    (() => {
      let query = supabase
        .from('designs')
        .select('*')
        .eq('user_id', userId);
        
      if (!includePrivate) {
        query = query.eq('private', false);
      }
      
      return query.order('created_at', { ascending: false });
    })(),
    // Fetch published series (or all if includePrivate is true)
    (() => {
      let query = supabase
        .from('series')
        .select('*')
        .eq('user_id', userId);
        
      if (!includePrivate) {
        query = query.eq('is_published', true);
      }
      
      return query.order('created_at', { ascending: false });
    })()
  ]);

  if (designsError) {
    console.error('Error fetching user designs:', designsError);
    throw designsError;
  }

  if (seriesError) {
    console.error('Error fetching user series:', seriesError);
    throw seriesError;
  }

  // Fetch series images for all series
  const seriesIds = series?.map(s => s.id) || [];
  const { data: seriesImages } = seriesIds.length > 0 ? await supabase
    .from('series_images')
    .select('series_id, image_url, order_index')
    .in('series_id', seriesIds)
    .eq('is_selected', true)
    .order('order_index', { ascending: true }) : { data: [] };

  // Fetch the profile for this user
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, name, avatar_url')
    .eq('id', userId)
    .single();

  // Create series images map
  const seriesImagesMap = new Map();
  if (seriesImages) {
    seriesImages.forEach(img => {
      if (!seriesImagesMap.has(img.series_id)) {
        seriesImagesMap.set(img.series_id, []);
      }
      seriesImagesMap.get(img.series_id).push(img.image_url);
    });
  }

  // Transform designs
  const transformedDesigns = designs.map((design: any) => ({
    id: design.id,
    tokenId: design.id,
    name: design.name,
    description: design.description || '',
    imageUrl: design.image_url || '/placeholder.svg',
    creator: profile?.username || design.user_id,
    owner: profile?.username || design.user_id,
    price: design.price ? design.price.toString() : '0',
    isForSale: design.price !== null,
    createdAt: design.created_at,
    type: 'design' as const,
  }));

  // Transform series
  const transformedSeries = (series || []).map((s: any) => {
    const images = seriesImagesMap.get(s.id) || [];
    
    return {
      id: s.id,
      tokenId: s.id,
      name: s.name,
      description: s.description || '',
      imageUrl: images[0] || '/placeholder.svg',
      creator: profile?.username || s.user_id,
      owner: profile?.username || s.user_id,
      price: '0',
      isForSale: false,
      createdAt: s.created_at,
      type: 'series' as const,
      seriesImages: images.slice(0, 4),
    };
  });

  // Combine and sort by creation date
  const allItems = [...transformedDesigns, ...transformedSeries];
  return allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const fetchUserPrivateDesigns = async (userId: string): Promise<NFT[]> => {
  const { data: designs, error } = await supabase
    .from('designs')
    .select('*')
    .eq('user_id', userId)
    .eq('private', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user private designs:', error);
    throw error;
  }

  // Fetch the profile for this user
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, name, avatar_url')
    .eq('id', userId)
    .single();

  return designs.map((design: any) => ({
    id: design.id,
    tokenId: design.id,
    name: design.name,
    description: design.description || '',
    imageUrl: design.image_url || '/placeholder.svg',
    creator: profile?.username || design.user_id,
    owner: profile?.username || design.user_id,
    price: design.price ? design.price.toString() : '0',
    isForSale: design.price !== null,
    createdAt: design.created_at,
  }));
};

export const deleteDesign = async (designId: string, userId?: string): Promise<void> => {
  console.log('🗑️ Deleting design with ID:', designId);
  
  // Verify ownership if userId is provided
  if (userId) {
    const { data: design, error: fetchError } = await supabase
      .from('designs')
      .select('user_id')
      .eq('id', designId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error fetching design for deletion:', fetchError);
      throw new Error(`Failed to verify design ownership: ${fetchError.message}`);
    }
    
    if (!design) {
      throw new Error('Design not found');
    }
    
    if (design.user_id !== userId) {
      throw new Error('You can only delete your own designs');
    }
  }

  const { error } = await supabase
    .from('designs')
    .delete()
    .eq('id', designId);

  if (error) {
    console.error('❌ Error deleting design:', error);
    throw new Error(`Failed to delete design: ${error.message}`);
  }

  console.log('✅ Design deleted successfully');
};
