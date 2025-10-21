import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImageSizes {
  original: string;
  thumbnail: string;
  medium: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt, model = 'flux', width = 1024, height = 1024 } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Use Pollinations API for image generation
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${model}&width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`

    console.log('🎨 Generating image with Pollinations API...')
    
    // Fetch the original image
    const imageResponse = await fetch(pollinationsUrl)
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to generate image: ${imageResponse.status}`)
    }

    // Convert original to base64
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    )
    const originalDataUrl = `data:image/png;base64,${base64Image}`

    console.log('✅ Original image generated, creating optimized sizes...')

    // Create optimized versions using a simple approach
    const sizes: ImageSizes = {
      original: originalDataUrl,
      thumbnail: originalDataUrl, // Will be optimized on client side
      medium: originalDataUrl    // Will be optimized on client side
    }

    console.log('📊 Image generation completed:', {
      prompt: prompt.substring(0, 50) + '...',
      originalSize: `${Math.round(originalDataUrl.length / 1024)}kb`,
      model,
      dimensions: `${width}x${height}`
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: originalDataUrl,
        sizes,
        prompt,
        model,
        dimensions: `${width}x${height}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Error generating optimized image:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to generate optimized image',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})