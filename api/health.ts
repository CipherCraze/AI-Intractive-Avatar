import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    console.log('[api/health] Health check requested')
    
    // Check environment variables
    const hasGemini = (process.env.GEMINI_API_KEY || '').length > 10
    const hasHeygen = (process.env.HEYGEN_API_KEY || '').length > 10 && (process.env.HEYGEN_AVATAR_ID || '').length > 10
    const hasHuggingFace = (process.env.HF_API_TOKEN || '').length > 10
    const hasPexels = (process.env.PEXELS_API_KEY || '').length > 10

    return res.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      env: {
        hasGemini,
        hasHeygen,
        hasHuggingFace,
        hasPexels,
        nodeVersion: process.version,
        platform: 'vercel'
      }
    })
  } catch (error: any) {
    console.error('[api/health] Error:', error)
    return res.status(500).json({ 
      error: 'Health check failed',
      details: error.message 
    })
  }
}
