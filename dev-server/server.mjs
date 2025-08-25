console.log('[dev-server] Starting server...')

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'

console.log('[dev-server] Imports loaded successfully')

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

console.log('[dev-server] Environment loaded')

const app = express()
app.use(cors())
app.use(express.json())

console.log('[dev-server] Express app configured')

const hasGemini = !!process.env.GEMINI_API_KEY
const hasHeygen = !!process.env.HEYGEN_API_KEY && !!process.env.HEYGEN_AVATAR_ID
const genAI = hasGemini ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null
const model = hasGemini ? genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }) : null

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

app.get('/', (req, res) => res.status(200).send('Tutor API running. Use /api/health or /api/ask.'))
app.get('/api/health', (req, res) => {
	console.log('[api/health] Health check requested')
	res.json({ 
		ok: true, 
		timestamp: new Date().toISOString(),
		env: {
			hasGemini,
			hasHeygen,
			nodeVersion: process.version
		}
	})
})

function buildMock(question) {
  const concept = (question || 'General').split(/\s+/).slice(0, 2).join(' ') || 'General'
  const lowerQ = question.toLowerCase()
  
  // Smart subject detection
  let subject = 'General'
  if (lowerQ.includes('photosynthesis') || lowerQ.includes('biology') || lowerQ.includes('cell') || lowerQ.includes('dna')) {
    subject = 'Biology'
  } else if (lowerQ.includes('physics') || lowerQ.includes('gravity') || lowerQ.includes('wave') || lowerQ.includes('force')) {
    subject = 'Physics'
  } else if (lowerQ.includes('math') || lowerQ.includes('algebra') || lowerQ.includes('geometry') || lowerQ.includes('coordinate')) {
    subject = 'Mathematics'
  } else if (lowerQ.includes('chemistry') || lowerQ.includes('atom') || lowerQ.includes('molecule')) {
    subject = 'Chemistry'
  } else if (lowerQ.includes('programming') || lowerQ.includes('algorithm') || lowerQ.includes('computer')) {
    subject = 'Computer Science'
  }
  
  // Smart difficulty detection
  let difficulty = 'beginner'
  if (lowerQ.includes('advanced') || lowerQ.includes('complex') || lowerQ.includes('derive')) {
    difficulty = 'advanced'
  } else if (lowerQ.includes('analyze') || lowerQ.includes('compare') || lowerQ.includes('how does')) {
    difficulty = 'intermediate'
  }
  
  return {
    answer: `Here is a comprehensive explanation of ${concept}. This is a mock response because API keys are not configured. The system would normally provide detailed, engaging explanations with real-world examples and step-by-step breakdowns to help you understand this ${subject.toLowerCase()} concept.`,
    concept,
    slides: [
      `Overview of ${concept}`,
      'Key steps or components',
      'Real-world examples',
      'Common applications',
      'Why it matters',
      'Quick recap and next steps'
    ],
    difficulty,
    subject,
    interactiveElements: ['concept-visualization', 'step-by-step-guide'],
    videoUrl: null,
    jobId: null,
  }
}

app.post('/api/ask', async (req, res) => {
  const { question, backgroundPreference } = req.body || {}
  if (!question) return res.status(400).json({ error: 'Missing question' })

  // If keys missing, return mock so frontend can function
  if (!hasGemini || !hasHeygen) {
    return res.status(200).json(buildMock(question))
  }

  try {
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
  "interactiveElements": ["element1", "element2"] // Optional interactive features to highlight
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

    let parsed = {}
    try { 
      // Clean the response to ensure it's valid JSON
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleanText) 
    } catch (parseError) { 
      console.log('Failed to parse Gemini response:', text)
      // Fallback parsing - try to extract key information
      parsed = extractInfoFromText(text, question)
    }

    // Validate and sanitize the response
    const answer = (parsed.answer || 'Let me think about that topic.').slice(0, 2000)
    const concept = (parsed.concept || extractConceptFromQuestion(question)).slice(0, 64)
    const difficulty = parsed.difficulty || 'beginner'
    const subject = parsed.subject || 'General'
    const interactiveElements = Array.isArray(parsed.interactiveElements) ? parsed.interactiveElements : []
    
    const slides = Array.isArray(parsed.slides) && parsed.slides.length ? 
      parsed.slides.slice(0, 6) : 
      generateDefaultSlides(concept)

    console.log(`[Gemini] Generated content for: ${concept} (${subject}, ${difficulty} level)`)

    // Enhanced background selection based on subject and content
    const bgPref = backgroundPreference || 'auto'
    let background = { type: 'transparent' }
    
    if (bgPref === 'green') {
      background = { type: 'color', value: '#00FF00' }
    } else if (bgPref === 'auto') {
      // Smart background selection based on subject
      background = getSmartBackground(subject, concept)
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
        headers: { 'X-Api-Key': process.env.HEYGEN_API_KEY, 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    )

    let videoUrl = startRes?.data?.data?.video_url || null
    const jobId = startRes?.data?.data?.video_id || startRes?.data?.data?.task_id || null

    if (!videoUrl && jobId) {
      let attempt = 0
      const maxAttempts = 12
      while (attempt < maxAttempts) {
        await sleep(Math.min(1000 * Math.pow(1.5, attempt), 8000))
        attempt++
        const poll = await axios.get(`https://api.heygen.com/v1/video.status?id=${jobId}`,
          { headers: { 'X-Api-Key': process.env.HEYGEN_API_KEY }, timeout: 15000 })
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
  } catch (err) {
    console.error('[api/ask] error', err?.response?.data || err?.message || err)
    // On error, return a mock so frontend keeps flowing
    return res.status(200).json(buildMock(question))
  }
})

// Helper functions for enhanced Gemini integration
function extractInfoFromText(text, question) {
  // Fallback extraction when JSON parsing fails
  const lines = text.split('\n').filter(line => line.trim())
  let answer = ''
  let concept = extractConceptFromQuestion(question)
  let slides = []
  
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

function extractConceptFromQuestion(question) {
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

function generateDefaultSlides(concept) {
  return [
    `Introduction to ${concept}`,
    'Key components and principles',
    'Real-world applications',
    'Common examples',
    'Why it matters'
  ]
}

function getSmartBackground(subject, concept) {
  // Smart background selection based on educational content
  const backgroundMap = {
    'Biology': { type: 'gradient', colors: ['#2d5016', '#5cb85c'] },
    'Physics': { type: 'gradient', colors: ['#1a1a2e', '#16213e'] },
    'Chemistry': { type: 'gradient', colors: ['#4a1a4a', '#8e44ad'] },
    'Mathematics': { type: 'gradient', colors: ['#2c3e50', '#3498db'] },
    'Computer Science': { type: 'gradient', colors: ['#1a1a1a', '#34495e'] }
  }
  
  return backgroundMap[subject] || { type: 'transparent' }
}

app.get('/api/video-status', async (req, res) => {
  try {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const poll = await axios.get(
      `https://api.heygen.com/v1/video.status?id=${encodeURIComponent(String(id))}`,
      { headers: { 'X-Api-Key': process.env.HEYGEN_API_KEY }, timeout: 15000 }
    )
    return res.status(200).json(poll.data)
  } catch (err) {
    console.error(err?.response?.data || err?.message || err)
    return res.status(500).json({ error: 'Failed to fetch status' })
  }
})

const PORT = process.env.PORT || 5000

// Add error handling for the server
const server = app.listen(PORT, '127.0.0.1', () => {
	console.log(`[dev-server] listening on http://127.0.0.1:${PORT}`)
	console.log(`[dev-server] Environment check:`)
	console.log(`  - GEMINI_API_KEY: ${hasGemini ? 'Set' : 'Missing'}`)
	console.log(`  - HEYGEN_API_KEY: ${hasHeygen ? 'Set' : 'Missing'}`)
	console.log(`  - HEYGEN_AVATAR_ID: ${process.env.HEYGEN_AVATAR_ID ? 'Set' : 'Missing'}`)
})

server.on('error', (err) => {
	console.error('[dev-server] Server error:', err)
	if (err.code === 'EADDRINUSE') {
		console.log(`[dev-server] Port ${PORT} is in use, trying port ${PORT + 1}`)
		server.listen(PORT + 1, '127.0.0.1')
	} else {
		process.exit(1)
	}
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
	console.error('[dev-server] Uncaught exception:', err)
	process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
	console.error('[dev-server] Unhandled rejection at:', promise, 'reason:', reason)
	process.exit(1)
})
