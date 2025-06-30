import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface TransformRequest {
  audioBase64: string;
  style: string;
  parameters?: {
    duration?: number;
    temperature?: number;
    prompt?: string;
    continuation?: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audioBase64, style, parameters = {} }: TransformRequest = await req.json()

    // Get Replicate API key from environment
    const replicateApiKey = Deno.env.get('REPLICATE_API_TOKEN')
    
    console.log('Environment check:')
    console.log('- REPLICATE_API_TOKEN exists:', !!replicateApiKey)
    console.log('- Key format valid:', replicateApiKey?.startsWith('r8_'))
    console.log('- Key length:', replicateApiKey?.length || 0)
    
    if (!replicateApiKey) {
      console.error('❌ Replicate API key not found in environment variables')
      throw new Error('Replicate API key not configured in Supabase environment. Please add REPLICATE_API_TOKEN to your Supabase project secrets.')
    }

    if (!replicateApiKey.startsWith('r8_')) {
      console.error('❌ Invalid Replicate API key format')
      throw new Error('Invalid Replicate API key format. Keys should start with "r8_"')
    }

    // Style to prompt mapping
    const stylePrompts: Record<string, string> = {
      orchestral: 'orchestral arrangement with strings, brass, and woodwinds',
      electronic: 'electronic dance music with synthesizers and beats',
      jazz: 'jazz ensemble with piano, bass, and drums',
      rock: 'rock band with electric guitars and drums',
      acoustic: 'acoustic guitar and vocals',
      ambient: 'ambient soundscape with ethereal textures'
    }

    const prompt = parameters.prompt || stylePrompts[style] || stylePrompts.orchestral

    // Clean the audioBase64 string to ensure it's properly formatted
    let cleanedAudioBase64 = audioBase64;
    // If it's a data URL, extract just the base64 part
    if (cleanedAudioBase64.startsWith('data:')) {
      cleanedAudioBase64 = cleanedAudioBase64.split(',')[1];
    }

    // Prepare the request to Replicate
    const replicateRequest = {
      version: "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
      input: {
        prompt: prompt,
        model_version: "melody-large",
        duration: Math.min(parameters.duration || 15, 30),
        temperature: Math.min(Math.max(parameters.temperature || 1.0, 0.1), 2.0),
        top_k: 250,
        top_p: 0.0,
        classifier_free_guidance: 3.0,
        // Use the correct parameter name for MusicGen
        melody: cleanedAudioBase64, // This is the correct parameter name for audio input
        continuation: parameters.continuation === true // Explicitly set, default to false
      }
    }

    console.log('Making request to Replicate API...')
    console.log('Request details:', {
      version: replicateRequest.version,
      input: {
        ...replicateRequest.input,
        melody: '[BASE64_DATA]' // Don't log the actual base64 data
      }
    })

    // Make request to Replicate
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(replicateRequest),
    })

    console.log('Replicate API response status:', response.status)
    console.log('Replicate API response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Replicate API error:', response.status, errorText)
      
      let userFriendlyError = 'AI transformation service error'
      
      if (response.status === 401) {
        userFriendlyError = 'Invalid Replicate API key. Please check your API token configuration.'
      } else if (response.status === 403) {
        userFriendlyError = 'Access denied to Replicate API. Please verify your account permissions.'
      } else if (response.status === 429) {
        userFriendlyError = 'Rate limit exceeded. Please try again in a few minutes.'
      } else if (response.status >= 500) {
        userFriendlyError = 'Replicate service temporarily unavailable. Please try again later.'
      }
      
      throw new Error(`${userFriendlyError} (Status: ${response.status}) - ${errorText}`)
    }

    const prediction = await response.json()
    console.log('✅ Replicate prediction created successfully:', prediction.id)

    return new Response(
      JSON.stringify({
        success: true,
        prediction_id: prediction.id,
        status: prediction.status,
        urls: prediction.urls
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error in ai-transform function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})