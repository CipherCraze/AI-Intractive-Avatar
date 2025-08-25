import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Helper functions for enhanced Gemini integration
function extractInfoFromText(text: string, question: string) {
	// Fallback extraction when JSON parsing fails
	const lines = text.split('\n').filter(line => line.trim())
	let answer = ''
	let concept = extractConceptFromQuestion(question)
	let slides: string[] = []
	
	// Try to extract answer from the text
	const answerMatch = text.match(/answer["\s]*:[\s]*["']([^"']+)["']/i)
	if (answerMatch) {
		answer = answerMatch[1]
	} else {
		// Use first few sentences as answer
		answer = lines.slice(0, 3).join(' ')
	}
	
	// Try to extract concept
	const conceptMatch = text.match(/concept["\s]*:[\s]*["']([^"']+)["']/i)
	if (conceptMatch) {
		concept = conceptMatch[1]
	}
	
	// Try to extract slides
	const slidesMatch = text.match(/slides["\s]*:[\s]*\[([^\]]+)\]/i)
	if (slidesMatch) {
		slides = slidesMatch[1].split(',').map(s => s.replace(/["']/g, '').trim())
	}
	
	return { answer, concept, slides }
}

function extractConceptFromQuestion(question: string): string {
	// Extract key concept from the question
	const lowerQ = question.toLowerCase()
	const concepts = [
		'photosynthesis', 'respiration', 'dna', 'evolution', 'mitosis', 'meiosis',
		'gravity', 'magnetism', 'electricity', 'waves', 'optics', 'thermodynamics',
		'algebra', 'geometry', 'calculus', 'trigonometry', 'statistics', 'probability',
		'bonding', 'reactions', 'atoms', 'molecules', 'acids', 'bases',
		'algorithms', 'data structures', 'programming', 'binary search', 'sorting'
	]
	
	for (const concept of concepts) {
		if (lowerQ.includes(concept)) {
			return concept.charAt(0).toUpperCase() + concept.slice(1)
		}
	}
	
	// Extract first meaningful word
	const words = question.split(' ').filter(w => w.length > 3)
	return words[0] || 'General'
}

function generateDefaultSlides(concept: string): string[] {
	return [
		`Introduction to ${concept}`,
		'Key components and principles',
		'Real-world applications',
		'Common examples',
		'Why it matters'
	]
}

function getSmartBackground(subject: string): { type: 'transparent' } | { type: 'color'; value: string } {
	// Smart background selection based on educational content
	return { type: 'transparent' }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
		const { question, backgroundPreference } = req.body as { question?: string; backgroundPreference?: 'transparent' | 'green' | 'auto' }
		if (!question) return res.status(400).json({ error: 'Missing question' })

		// Enhanced prompt for better educational content generation
		const prompt = `You are an expert educational AI tutor. Your role is to explain complex topics in an engaging, clear way for students.

INSTRUCTIONS:
1. Analyze the question to identify the main educational concept
2. Provide a clear, engaging explanation suitable for the student's level
3. Create bullet points that highlight key learning objectives
4. Use examples and analogies when helpful
5. Return ONLY valid JSON with no additional text

REQUIRED JSON FORMAT:
{
  "answer": "A clear, engaging explanation (150-300 words)",
  "concept": "Main topic title (e.g., 'Photosynthesis', 'Coordinate Geometry', 'Wave Motion')",
  "slides": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "difficulty": "beginner|intermediate|advanced",
  "subject": "Biology|Physics|Chemistry|Mathematics|Computer Science|General",
  "interactiveElements": ["element1", "element2"]
}

EXAMPLE:
{
  "answer": "Photosynthesis is the amazing process where plants convert sunlight into energy! Think of plants as solar panels that can make their own food. During photosynthesis, plants take in carbon dioxide from the air and water from their roots. Using chlorophyll (the green pigment in leaves), they capture sunlight energy to combine these ingredients into glucose (sugar) and release oxygen as a bonus. This process is crucial for all life on Earth because it produces the oxygen we breathe and forms the base of most food chains.",
  "concept": "Photosynthesis",
  "slides": [
    "Plants capture sunlight using chlorophyll",
    "Carbon dioxide enters through leaf pores",
    "Water travels up from roots to leaves",
    "Glucose (sugar) is produced as plant food",
    "Oxygen is released as a byproduct"
  ],
  "difficulty": "beginner",
  "subject": "Biology",
  "interactiveElements": ["light-absorption", "molecular-flow"]
}

QUESTION: ${question}`

		const result = await model.generateContent(prompt)
		const text = result.response.text().trim()

		let parsed: { 
			answer?: string; 
			concept?: string; 
			slides?: string[];
			difficulty?: string;
			subject?: string;
			interactiveElements?: string[];
		} = {}
		
		try {
			// Clean the response to ensure it's valid JSON
			const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
			parsed = JSON.parse(cleanText)
		} catch {
			// Fallback parsing
			parsed = extractInfoFromText(text, question)
		}

		// Validate and sanitize the response
		const answer = (parsed.answer || 'Let me think about that topic.').slice(0, 2000)
		const concept = (parsed.concept || extractConceptFromQuestion(question)).slice(0, 64)
		const difficulty = parsed.difficulty || 'beginner'
		const subject = parsed.subject || 'General'
		const interactiveElements = Array.isArray(parsed.interactiveElements) ? parsed.interactiveElements : []
		
		const slides = Array.isArray(parsed.slides) && parsed.slides.length > 0
			? parsed.slides.slice(0, 6)
			: generateDefaultSlides(concept)

		// Enhanced background selection based on subject and content
		const bgPref = backgroundPreference || 'auto'
		let background: { type: 'transparent' } | { type: 'color'; value: string } = { type: 'transparent' }
		
		if (bgPref === 'green') {
			background = { type: 'color', value: '#00FF00' }
		} else if (bgPref === 'auto') {
			background = getSmartBackground(subject)
		}

		const startRes = await axios.post(
			'https://api.heygen.com/v2/video/generate',
			{
				video_inputs: [
					{
						character: { type: 'avatar', avatar_id: process.env.HEYGEN_AVATAR_ID, avatar_style: 'normal' },
						voice: { type: 'text', input_text: answer, voice_id: process.env.HEYGEN_VOICE_ID || 'en-US' },
						background,
					},
				],
				dimension: { width: 1280, height: 720 },
			},
			{
				headers: {
					'X-Api-Key': `${process.env.HEYGEN_API_KEY}`,
					'Content-Type': 'application/json',
				},
				timeout: 30000,
			}
		)

		let videoUrl: string | null = startRes?.data?.data?.video_url || null
		const jobId: string | null = startRes?.data?.data?.video_id || startRes?.data?.data?.task_id || null

		if (!videoUrl && jobId) {
			let attempt = 0
			const maxAttempts = 12
			while (attempt < maxAttempts) {
				await sleep(Math.min(1000 * Math.pow(1.5, attempt), 8000))
				attempt++
				const poll = await axios.get(`https://api.heygen.com/v1/video.status?id=${jobId}`,
					{ headers: { 'X-Api-Key': `${process.env.HEYGEN_API_KEY}` }, timeout: 15000 })
				const status = poll?.data?.data?.status
				if (status === 'completed' || status === 'succeeded' || poll?.data?.data?.video_url) {
					videoUrl = poll?.data?.data?.video_url || null
					break
				}
				if (status === 'failed' || status === 'error') throw new Error('HeyGen failed to render video')
			}
		}

		return res.status(200).json({ 
			answer, 
			concept, 
			slides, 
			videoUrl, 
			jobId, 
			difficulty,
			subject,
			interactiveElements 
		})
	} catch (err: any) {
		console.error(err?.response?.data || err?.message || err)
		return res.status(500).json({ error: 'Something went wrong' })
	}
}
