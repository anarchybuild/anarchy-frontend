import { supabase } from '@/integrations/supabase/client';
import { dataURLToFile } from '@/utils/fileUtils';

export interface ImageUploadResult {
  originalUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
}

/**
 * Upload generated images to Supabase Storage
 */
export const uploadGeneratedImages = async (
  originalDataUrl: string,
  thumbnailDataUrl: string,
  mediumDataUrl: string,
  userId: string,
  imageName: string = `generated-${Date.now()}`
): Promise<ImageUploadResult> => {
  try {
    // Convert data URLs to files
    const originalFile = dataURLToFile(originalDataUrl, `${imageName}-original.webp`);
    const thumbnailFile = dataURLToFile(thumbnailDataUrl, `${imageName}-thumbnail.webp`);
    const mediumFile = dataURLToFile(mediumDataUrl, `${imageName}-medium.webp`);

    // Create user folder path
    const userFolder = `${userId}`;

    // Upload all three sizes in parallel
    const [originalUpload, thumbnailUpload, mediumUpload] = await Promise.all([
      supabase.storage
        .from('generated-images')
        .upload(`${userFolder}/${imageName}-original.webp`, originalFile, {
          cacheControl: '3600',
          upsert: false
        }),
      
      supabase.storage
        .from('generated-images')
        .upload(`${userFolder}/${imageName}-thumbnail.webp`, thumbnailFile, {
          cacheControl: '3600',
          upsert: false
        }),
      
      supabase.storage
        .from('generated-images')
        .upload(`${userFolder}/${imageName}-medium.webp`, mediumFile, {
          cacheControl: '3600',
          upsert: false
        })
    ]);

    // Check for upload errors
    if (originalUpload.error) throw originalUpload.error;
    if (thumbnailUpload.error) throw thumbnailUpload.error;
    if (mediumUpload.error) throw mediumUpload.error;

    // Get public URLs
    const { data: originalUrl } = supabase.storage
      .from('generated-images')
      .getPublicUrl(originalUpload.data.path);
    
    const { data: thumbnailUrl } = supabase.storage
      .from('generated-images')
      .getPublicUrl(thumbnailUpload.data.path);
    
    const { data: mediumUrl } = supabase.storage
      .from('generated-images')
      .getPublicUrl(mediumUpload.data.path);

    console.log('📸 Images uploaded successfully:', {
      original: originalUrl.publicUrl,
      thumbnail: thumbnailUrl.publicUrl,
      medium: mediumUrl.publicUrl
    });

    return {
      originalUrl: originalUrl.publicUrl,
      thumbnailUrl: thumbnailUrl.publicUrl,
      mediumUrl: mediumUrl.publicUrl
    };
  } catch (error) {
    console.error('❌ Failed to upload generated images:', error);
    throw new Error(`Failed to upload images: ${error.message}`);
  }
};

/**
 * Delete generated images from Supabase Storage
 */
export const deleteGeneratedImages = async (
  imageUrls: string[],
  userId: string
): Promise<void> => {
  try {
    // Extract file paths from URLs
    const filePaths = imageUrls
      .map(url => {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        // Find the path after '/storage/v1/object/public/generated-images/'
        const bucketIndex = pathParts.indexOf('generated-images');
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          return pathParts.slice(bucketIndex + 1).join('/');
        }
        return null;
      })
      .filter(path => path !== null && path.startsWith(userId));

    if (filePaths.length === 0) {
      console.log('No valid file paths found for deletion');
      return;
    }

    // Delete files from storage
    const { error } = await supabase.storage
      .from('generated-images')
      .remove(filePaths);

    if (error) {
      console.error('Error deleting images:', error);
      throw error;
    }

    console.log('🗑️ Successfully deleted images:', filePaths);
  } catch (error) {
    console.error('❌ Failed to delete generated images:', error);
    throw new Error(`Failed to delete images: ${error.message}`);
  }
};