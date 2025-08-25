import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
		
		const { query, type = 'photos', per_page = 5 } = req.query
		
		if (!query || typeof query !== 'string') {
			return res.status(400).json({ error: 'Missing query parameter' })
		}
		
		const PEXELS_API_KEY = process.env.PEXELS_API_KEY
		if (!PEXELS_API_KEY) {
			return res.status(500).json({ error: 'Pexels API key not configured' })
		}
		
		const endpoint = type === 'videos' 
			? `https://api.pexels.com/videos/search`
			: `https://api.pexels.com/v1/search`
		
		const response = await axios.get(endpoint, {
			headers: {
				'Authorization': PEXELS_API_KEY
			},
			params: {
				query: query,
				per_page: per_page,
				orientation: 'landscape'
			}
		})
		
		// Transform the response to include only needed data
		const content = type === 'videos' 
			? response.data.videos?.map((video: any) => ({
				id: video.id,
				url: video.video_files?.[0]?.link,
				image: video.image,
				duration: video.duration,
				width: video.width,
				height: video.height
			}))
			: response.data.photos?.map((photo: any) => ({
				id: photo.id,
				url: photo.src?.large,
				original: photo.src?.original,
				medium: photo.src?.medium,
				small: photo.src?.small,
				alt: photo.alt,
				width: photo.width,
				height: photo.height
			}))
		
		return res.status(200).json({
			success: true,
			type,
			query,
			content: content || [],
			total: content?.length || 0
		})
		
	} catch (error: any) {
		console.error('Pexels API error:', error?.response?.data || error.message)
		return res.status(500).json({ 
			error: 'Failed to fetch content from Pexels',
			details: error?.response?.status === 429 ? 'Rate limit exceeded' : 'Unknown error'
		})
	}
}
