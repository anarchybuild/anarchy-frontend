import { supabase } from '@/integrations/supabase/client';
import { Collection, CollectionItem } from '@/types/collection';

export const createCollection = async (name: string, description: string, userId: string): Promise<Collection> => {
  const { data, error } = await supabase
    .from('collections')
    .insert({
      name: name.trim(),
      description: description.trim() || null,
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating collection:', error);
    throw new Error('Failed to create collection');
  }

  return data;
};

export const getUserCollections = async (userId: string): Promise<Collection[]> => {
  console.log('getUserCollections called with userId:', userId);
  
  try {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_items(
          id,
          design_id,
          designs(image_url)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log('getUserCollections query result:', { data, error });

    if (error) {
      console.error('Error fetching collections:', error);
      throw new Error(`Failed to fetch collections: ${error.message}`);
    }

    const result = data.map(collection => ({
      ...collection,
      item_count: collection.collection_items?.length || 0,
      preview_images: collection.collection_items
        ?.slice(0, 4)
        .map(item => item.designs?.image_url)
        .filter(Boolean) || []
    }));
    
    console.log('getUserCollections returning:', result);
    return result;
  } catch (error) {
    console.error('Unexpected error in getUserCollections:', error);
    throw error;
  }
};

export const addDesignToCollection = async (collectionId: string, designId: string): Promise<CollectionItem> => {
  const { data, error } = await supabase
    .from('collection_items')
    .insert({
      collection_id: collectionId,
      design_id: designId
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding design to collection:', error);
    throw new Error('Failed to add design to collection');
  }

  return data;
};

export const removeDesignFromCollection = async (collectionId: string, designId: string): Promise<void> => {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('design_id', designId);

  if (error) {
    console.error('Error removing design from collection:', error);
    throw new Error('Failed to remove design from collection');
  }
};

export const getCollection = async (collectionId: string): Promise<Collection> => {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .single();

  if (error) {
    console.error('Error fetching collection:', error);
    throw new Error('Failed to fetch collection');
  }

  return data;
};

export const getCollectionItems = async (collectionId: string) => {
  const { data, error } = await supabase
    .from('collection_items')
    .select(`
      *,
      designs(*)
    `)
    .eq('collection_id', collectionId)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Error fetching collection items:', error);
    throw new Error('Failed to fetch collection items');
  }

  return data.map(item => ({
    ...item.designs,
    collection_item_id: item.id,
    added_at: item.added_at
  }));
};

export const deleteCollection = async (collectionId: string): Promise<void> => {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId);

  if (error) {
    console.error('Error deleting collection:', error);
    throw new Error('Failed to delete collection');
  }
};

export const isDesignSaved = async (designId: string, userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('collection_items')
    .select(`
      id,
      collections!inner(user_id)
    `)
    .eq('design_id', designId)
    .eq('collections.user_id', userId)
    .limit(1);

  if (error) {
    console.error('Error checking if design is saved:', error);
    return false;
  }

  return data.length > 0;
};