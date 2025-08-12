import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Fetch the image
    const imageResponse = await fetch(pollinationsUrl)
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to generate image: ${imageResponse.status}`)
    }

    // Convert to base64 using proper method
    const imageBuffer = await imageResponse.arrayBuffer()
    
    // Use proper base64 encoding for Deno
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    )
    
    const dataUrl = `data:image/png;base64,${base64Image}`

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: dataUrl,
        prompt,
        model,
        dimensions: `${width}x${height}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating image:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to generate image',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})