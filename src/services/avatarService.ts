
import { supabase } from '@/integrations/supabase/client';

export interface AvatarUploadResult {
  success: boolean;
  error?: string;
}

export const uploadAvatar = async (
  file: File,
  userId: string
): Promise<AvatarUploadResult> => {
  try {
    console.log('Starting avatar upload for user:', userId);
    console.log('File details:', { name: file.name, size: file.size, type: file.type });

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    
    console.log('Generated filename:', fileName);

    // Upload to Supabase Storage using the profilepicture bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profilepicture')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('Upload successful:', uploadData);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profilepicture')
      .getPublicUrl(fileName);

    console.log('Generated public URL:', publicUrl);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      throw updateError;
    }

    console.log('Profile updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('new row violates row-level security policy')) {
      return { 
        success: false, 
        error: 'Permission denied. Please make sure you are logged in and try again.' 
      };
    }
    
    if (error.message?.includes('bucket') || error.message?.includes('storage')) {
      return { 
        success: false, 
        error: 'Storage configuration error. Please contact support.' 
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to update profile picture. Please try again.' 
    };
  }
};

export const removeAvatar = async (userId: string): Promise<AvatarUploadResult> => {
  try {
    console.log('Removing avatar for user:', userId);

    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error removing avatar:', error);
      throw error;
    }

    console.log('Avatar removed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error removing avatar:', error);
    
    if (error.message?.includes('new row violates row-level security policy')) {
      return { 
        success: false, 
        error: 'Permission denied. Please make sure you are logged in and try again.' 
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to remove profile picture. Please try again.' 
    };
  }
};
