import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
		const { id } = req.query
		if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing id' })
		const poll = await axios.get(`https://api.heygen.com/v1/video.status?id=${encodeURIComponent(id)}`,
			{ headers: { 'X-Api-Key': `${process.env.HEYGEN_API_KEY}` }, timeout: 15000 })
		return res.status(200).json(poll.data)
	} catch (err: any) {
		console.error(err?.response?.data || err?.message || err)
		return res.status(500).json({ error: 'Failed to fetch status' })
	}
}

