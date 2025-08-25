import axios from 'axios'

function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms))
}

type AskResponse = {
	answer: string
	concept: string
	slides: string[]
	videoUrl: string | null
	jobId?: string | null
	difficulty?: string
	subject?: string
	interactiveElements?: string[]
}

export async function ask(question: string, backgroundPreference: 'transparent' | 'green' | 'auto' = 'auto') {
	const res = await axios.post('/api/ask', { question, backgroundPreference })
	let { 
		answer, 
		concept, 
		slides, 
		videoUrl, 
		jobId, 
		difficulty, 
		subject, 
		interactiveElements 
	} = res.data as AskResponse

	if (!videoUrl && jobId) {
		let attempt = 0
		const maxAttempts = 15
		while (attempt < maxAttempts) {
			await sleep(Math.min(1000 * Math.pow(1.4, attempt), 6000))
			attempt++
			try {
				const poll = await axios.get(`/api/video-status`, { params: { id: jobId } })
				const status = poll?.data?.data?.status
				const url = poll?.data?.data?.video_url as string | undefined
				if (url || status === 'completed' || status === 'succeeded') {
					videoUrl = url || null
					break
				}
				if (status === 'failed' || status === 'error') {
					break
				}
			} catch {
				// keep polling
			}
		}
	}

	return { answer, concept, slides, videoUrl, jobId, difficulty, subject, interactiveElements }
}

export async function fetchPexelsContent(query: string, type: 'photos' | 'videos' = 'photos', perPage: number = 5) {
	try {
		const response = await axios.get('/api/pexels', {
			params: {
				query,
				type,
				per_page: perPage
			}
		})
		return response.data
	} catch (error) {
		console.error('Failed to fetch Pexels content:', error)
		return { success: false, content: [], total: 0 }
	}
}
