import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

// Clean and validate environment variables
const HEYGEN_KEY = (process.env.HEYGEN_API_KEY || '').trim().replace(/['"]/g, '')
const hasHeygen = HEYGEN_KEY.length > 10

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
		const { id } = req.query
		if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing id' })
		
		if (!hasHeygen) {
			return res.status(200).json({ 
				data: { status: 'completed', video_url: null },
				message: 'HeyGen API not configured'
			})
		}
		
		console.log(`[api/video-status] Checking status for job: ${id}`)
		const poll = await axios.get(`https://api.heygen.com/v1/video.status?id=${encodeURIComponent(id)}`,
			{ headers: { 'X-Api-Key': HEYGEN_KEY }, timeout: 15000 })
		console.log(`[api/video-status] Response:`, poll.data)
		return res.status(200).json(poll.data)
	} catch (err: any) {
		console.error('[api/video-status] Error:', err?.response?.data || err?.message || err)
		return res.status(500).json({ error: 'Failed to fetch status', details: err.message })
	}
}

