import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

interface GenerateStyledImageRequest {
  imageDataUrl: string;
  prompt: string;
  theme: string;
}

function getFallbackPrompt(theme: string): string {
  const fallbackPrompts: Record<string, string> = {
    astronaut: "A space explorer in a futuristic spacesuit floating in zero gravity among stars and nebulae",
    medieval: "A noble knight in shining armor standing in a medieval castle courtyard",
    cyberpunk: "A futuristic figure with neon cybernetic enhancements in a dystopian cityscape",
    pirate: "A swashbuckling pirate captain on the deck of a ship with billowing sails",
    victorian: "An elegant person in Victorian-era clothing in an ornate 19th century parlor",
    western: "A rugged cowboy in the American frontier with desert landscape and tumbleweeds",
    zombie: "A post-apocalyptic survivor in a desolate wasteland with abandoned buildings",
    ninja: "A stealthy warrior in traditional black garb on a moonlit rooftop in feudal Japan"
  };
  
  return fallbackPrompts[theme] || `A person in ${theme} style setting with appropriate background and atmosphere`;
}

async function callGeminiWithRetry(prompt: string, baseImage?: string): Promise<Response> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const requestBody: any = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
        }
      };

      if (baseImage) {
        const [header, base64Data] = baseImage.split(',');
        const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        
        requestBody.contents[0].parts.unshift({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }

      console.log(`Making Gemini API request (attempt ${attempt})...`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        return response;
      } else if (response.status >= 500 && attempt < maxRetries) {
        console.log(`Server error ${response.status}, retrying in ${1000 * attempt}ms...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      } else {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Max retries exceeded');
}

async function callGeminiImageGenWithRetry(prompt: string): Promise<Response> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Making Gemini 2.5 Flash image generation request (attempt ${attempt})...`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Generate a photorealistic image: ${prompt}` }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            responseMimeType: "image/jpeg"
          }
        })
      });

      if (response.ok) {
        return response;
      } else if (response.status >= 500 && attempt < maxRetries) {
        console.log(`Gemini server error ${response.status}, retrying in ${1000 * attempt}ms...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      } else {
        const errorText = await response.text();
        throw new Error(`Gemini image gen API error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Gemini image gen attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Gemini image generation max retries exceeded');
}

function processImageGenResponse(data: any): string {
  console.log('Processing Imagen response:', JSON.stringify(data, null, 2));
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No image generated in response');
  }

  const candidate = data.candidates[0];
  
  // For Imagen 3, the response structure might be different
  if (candidate.image && candidate.image.bytesBase64Encoded) {
    return `data:image/png;base64,${candidate.image.bytesBase64Encoded}`;
  }
  
  // Fallback to original structure if it exists
  if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
    const part = candidate.content.parts[0];
    if (part.inlineData && part.inlineData.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error('No image data found in response structure');
}

async function generateStyledImage(imageDataUrl: string, prompt: string, theme: string): Promise<string> {
  if (!imageDataUrl || !prompt || !theme) {
    throw new Error('Missing required parameters');
  }

  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Extract base64 data from data URL
  const [header, base64Data] = imageDataUrl.split(',');
  
  try {
    console.log(`Generating styled image with theme: ${theme}`);
    
    // Step 1: Use Gemini to analyze the uploaded image and create a detailed prompt
    const analysisPrompt = `Analyze this portrait image and describe the person's key facial features, appearance, and characteristics. Then create a detailed prompt to generate a new image that transforms this person into a ${theme} style while keeping their facial features recognizable. The prompt should include: 1) Key facial features to preserve, 2) Appropriate ${theme} clothing/costume, 3) Suitable background for ${theme} theme, 4) Overall aesthetic and mood for ${theme}. Make it a comprehensive prompt for an AI image generator.`;
    
    const analysisResponse = await callGeminiWithRetry(analysisPrompt, imageDataUrl);
    const analysisData = await analysisResponse.json();
    
    if (!analysisData.candidates || !analysisData.candidates[0]?.content?.parts[0]?.text) {
      throw new Error('Failed to analyze image with Gemini');
    }
    
    const detailedPrompt = analysisData.candidates[0].content.parts[0].text;
    console.log('Generated detailed prompt:', detailedPrompt);
    
    // Step 2: Use Gemini 2.0 Flash for image generation
    const imageGenResponse = await callGeminiImageGenWithRetry(detailedPrompt);
    const imageData = await imageGenResponse.json();
    console.log('Gemini 2.0 Flash generation response structure:', JSON.stringify(imageData, null, 2));
    
    if (!imageData.candidates || imageData.candidates.length === 0) {
      throw new Error('No image data in Gemini response');
    }
    
    // Handle Gemini 2.0 Flash response structure for images
    const candidate = imageData.candidates[0];
    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
      const imagePart = candidate.content.parts.find((part: any) => part.inlineData);
      if (imagePart?.inlineData?.data) {
        const generatedImageUrl = `data:${imagePart.inlineData.mimeType || 'image/jpeg'};base64,${imagePart.inlineData.data}`;
        console.log('Image generation successful');
        return generatedImageUrl;
      }
    }
    
    throw new Error('No image data found in Gemini response structure');
    
  } catch (error: any) {
    console.error('Primary generation failed:', error);
    
    // Fallback: Use Imagen API with a simpler, safer prompt
    console.log('Primary generation failed, trying fallback approach...');
    const fallbackPrompt = `${getFallbackPrompt(theme)}, photorealistic portrait, high quality, detailed`;
    
    try {
      const fallbackResponse = await callGeminiImageGenWithRetry(fallbackPrompt);
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.candidates && fallbackData.candidates.length > 0) {
        const candidate = fallbackData.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const imagePart = candidate.content.parts.find((part: any) => part.inlineData);
          if (imagePart?.inlineData?.data) {
            console.log('Fallback generation successful');
            return `data:${imagePart.inlineData.mimeType || 'image/jpeg'};base64,${imagePart.inlineData.data}`;
          }
        }
      }
      
      throw new Error('No image data in fallback Gemini response');
      
    } catch (fallbackError) {
      console.error('Fallback generation also failed:', fallbackError);
      throw new Error(`Image generation failed completely. Primary error: ${error.message}. Fallback error: ${fallbackError.message}`);
    }
  }
}

serve(async (req) => {
  console.log('Edge function called:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Reading request body...');
    const body = await req.json();
    console.log('Request body received:', { theme: body.theme, hasImageData: !!body.imageDataUrl, hasPrompt: !!body.prompt });
    
    const { imageDataUrl, prompt, theme }: GenerateStyledImageRequest = body;

    console.log('Checking API key availability:', !!geminiApiKey);

    const styledImageUrl = await generateStyledImage(imageDataUrl, prompt, theme);

    console.log('Image generation successful');
    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: styledImageUrl,
        theme 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in generate-styled-image function:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred during image generation'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});