import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import crypto from 'crypto'

// Simple in-memory cache for this serverless function
const imageCache = new Map<string, { url: string; expiresAt: number }>()
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 // 24 hours

function cacheKeyFor(prompt: string, opts: Record<string, any> = {}) {
  return crypto.createHash('sha256').update(JSON.stringify({ prompt, ...opts })).digest('hex')
}

function generateEducationalPrompt(concept: string, subject: string) {
  const basePrompts: Record<string, string> = {
    'Biology': `detailed scientific diagram of ${concept}, labeled parts, clean educational illustration, high contrast, biology textbook style`,
    'Physics': `physics diagram showing ${concept}, mathematical formulas, vectors, clean scientific illustration, educational poster style`,
    'Chemistry': `chemistry diagram of ${concept}, molecular structures, chemical equations, laboratory style, educational illustration`,
    'Mathematics': `mathematical visualization of ${concept}, geometric shapes, coordinate grids, clean diagram, educational math textbook style`,
    'Computer Science': `technical diagram illustrating ${concept}, flowcharts, data structures, clean modern design, programming concept visualization`,
    'General': `educational illustration of ${concept}, clean diagram, informative design, suitable for learning`
  }
  
  return basePrompts[subject] || basePrompts['General']
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { concept, subject, style } = req.body as { 
      concept?: string
      subject?: string
      style?: string 
    }

    if (!concept) {
      return res.status(400).json({ error: 'Concept is required' })
    }

    const prompt = generateEducationalPrompt(concept, subject || 'General')
    console.log('[api/generate-background] Generating for:', concept, '->', prompt.slice(0, 80) + '...')

    // Check cache first
    const cacheKey = cacheKeyFor(prompt, { subject, style })
    const cached = imageCache.get(cacheKey)
    
    if (cached && cached.expiresAt > Date.now()) {
      console.log('[api/generate-background] Using cached result')
      return res.json({
        success: true,
        url: cached.url,
        cached: true,
        concept,
        prompt: prompt.slice(0, 100) + '...'
      })
    }

    const HF_TOKEN = process.env.HF_API_TOKEN
    if (!HF_TOKEN) {
      // Fallback to colored background
      const fallbackColors: Record<string, string> = {
        'Biology': '#2d5016',
        'Physics': '#1a1a2e', 
        'Chemistry': '#4a1a4a',
        'Mathematics': '#2c3e50',
        'Computer Science': '#1a1a1a'
      }
      
      return res.json({
        success: false,
        fallback: true,
        color: fallbackColors[subject || 'General'] || '#2c3e50',
        error: 'HuggingFace API token not configured',
        concept
      })
    }

    try {
      console.log('[api/generate-background] Calling HuggingFace API...')
      
      const response = await axios({
        method: 'POST',
        url: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          inputs: prompt,
          parameters: { 
            guidance_scale: 7.5, 
            width: 1280, 
            height: 720,
            num_inference_steps: 20
          }
        },
        responseType: 'arraybuffer',
        timeout: 60000 // 60 seconds for image generation
      })

      if (response.status !== 200) {
        throw new Error(`HF image generation failed: ${response.status}`)
      }

      // Convert to base64 data URL for immediate use
      const base64 = Buffer.from(response.data).toString('base64')
      const dataUrl = `data:image/png;base64,${base64}`
      
      // Cache the result
      imageCache.set(cacheKey, {
        url: dataUrl,
        expiresAt: Date.now() + CACHE_TTL_MS
      })

      console.log('[api/generate-background] Image generated successfully')
      
      return res.json({
        success: true,
        url: dataUrl,
        cached: false,
        concept,
        prompt: prompt.slice(0, 100) + '...'
      })

    } catch (hfError: any) {
      console.log('[api/generate-background] HF error:', hfError.message)
      
      // Fallback to colored background
      const fallbackColors: Record<string, string> = {
        'Biology': '#2d5016',
        'Physics': '#1a1a2e', 
        'Chemistry': '#4a1a4a',
        'Mathematics': '#2c3e50',
        'Computer Science': '#1a1a1a'
      }
      
      return res.json({
        success: false,
        fallback: true,
        color: fallbackColors[subject || 'General'] || '#2c3e50',
        error: hfError.message.includes('token') ? 'HuggingFace API token required' : 'Image generation temporarily unavailable',
        concept
      })
    }

  } catch (error: any) {
    console.error('[api/generate-background] Error:', error)
    return res.status(500).json({ 
      error: 'Failed to generate background',
      details: error.message 
    })
  }
}
