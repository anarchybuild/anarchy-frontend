/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { supabase } from '@/integrations/supabase/client';

// Note: All Gemini API logic is now handled by the Supabase edge function


/**
 * Generates a styled image using Gemini AI via Supabase edge function
 * @param imageDataUrl A data URL string of the source image (e.g., 'data:image/png;base64,...').
 * @param prompt The prompt to guide the image generation.
 * @param theme The theme string used for creating a fallback prompt if needed.
 * @returns A promise that resolves to a base64-encoded image data URL of the generated image.
 */
export async function generateStyledImage(imageDataUrl: string, prompt: string, theme: string): Promise<string> {
    if (!imageDataUrl || !prompt || !theme) {
        throw new Error('Invalid input: imageDataUrl, prompt, and theme are required');
    }

    try {
        console.log(`Generating styled image with theme: ${theme}`);
        
        // Call the Supabase edge function
        const { data, error } = await supabase.functions.invoke('generate-styled-image', {
            body: {
                imageDataUrl,
                prompt,
                theme
            }
        });

        if (error) {
            console.error('Edge function error:', error);
            throw new Error(`Failed to generate styled image: ${error.message}`);
        }

        if (!data || !data.success) {
            throw new Error(data?.error || 'Unknown error occurred during image generation');
        }

        return data.imageUrl;
    } catch (error: any) {
        console.error('Error in generateStyledImage:', error);
        throw new Error(`An unrecoverable error occurred during image generation. Error: ${error.message}`);
    }
}