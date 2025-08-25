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
const model = hasGemini ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null // Using flash instead of pro

// Rate limiting
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 4000 // 4 seconds between requests (15 per minute max)
let dailyRequestCount = 0
const MAX_DAILY_REQUESTS = 1400 // Leave some buffer

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
  return {
    answer: `Here is a comprehensive explanation of ${concept}. This is a mock response because API limits have been reached or API keys are not configured properly.`,
    concept,
    difficulty: 'beginner',
    subject: 'General',
    slides: [
      `Overview of ${concept}`,
      'Key steps or components',
      'Real-world examples and applications',
      'Common challenges and solutions',
      'Quick recap and summary'
    ],
    interactiveElements: ['animation', 'visualization'],
    videoUrl: null,
    jobId: null,
  }
}

// Enhanced rate limiting function
async function waitForRateLimit() {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
    console.log(`[rate-limit] Waiting ${waitTime}ms before next request`)
    await sleep(waitTime)
  }
  
  lastRequestTime = Date.now()
}

// Check daily quota
function checkDailyQuota() {
  if (dailyRequestCount >= MAX_DAILY_REQUESTS) {
    console.log(`[quota] Daily request limit reached: ${dailyRequestCount}/${MAX_DAILY_REQUESTS}`)
    return false
  }
  return true
}

// Enhanced Gemini request with retries
async function callGeminiWithRetry(prompt, maxRetries = 3) {
  if (!hasGemini || !model) {
    throw new Error('Gemini API not configured')
  }
  
  if (!checkDailyQuota()) {
    throw new Error('Daily quota exceeded')
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await waitForRateLimit()
      
      console.log(`[gemini] Attempt ${attempt}/${maxRetries} - Making request...`)
      const result = await model.generateContent(prompt)
      
      dailyRequestCount++
      console.log(`[gemini] Success! Daily count: ${dailyRequestCount}/${MAX_DAILY_REQUESTS}`)
      
      return result.response.text().trim()
    } catch (error) {
      console.log(`[gemini] Attempt ${attempt} failed:`, error.message)
      
      if (error.message.includes('429') || error.message.includes('quota')) {
        const retryDelay = Math.min(5000 * Math.pow(2, attempt - 1), 60000) // Exponential backoff, max 60s
        console.log(`[rate-limit] Rate limit hit, waiting ${retryDelay}ms before retry`)
        
        if (attempt < maxRetries) {
          await sleep(retryDelay)
          continue
        } else {
          throw new Error('Rate limit exceeded - please try again later')
        }
      } else {
        // Non-rate-limit error, don't retry
        throw error
      }
    }
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

    const result = await callGeminiWithRetry(prompt)
    const text = result

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
    
    // Handle rate limiting errors specifically
    if (err.message && (err.message.includes('Rate limit') || err.message.includes('quota'))) {
      return res.status(429).json({ 
        error: 'AI service is temporarily rate limited. Please try again in a few minutes.',
        retryAfter: 60
      })
    }
    
    // On other errors, return a mock so frontend keeps working
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
    'Biology': { type: 'color', value: '#2d5016' },
    'Physics': { type: 'color', value: '#1a1a2e' },
    'Chemistry': { type: 'color', value: '#4a1a4a' },
    'Mathematics': { type: 'color', value: '#2c3e50' },
    'Computer Science': { type: 'color', value: '#1a1a1a' }
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

app.get('/api/pexels', async (req, res) => {
  try {
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
      ? response.data.videos?.map((video) => ({
          id: video.id,
          url: video.video_files?.[0]?.link,
          image: video.image,
          duration: video.duration,
          width: video.width,
          height: video.height
        }))
      : response.data.photos?.map((photo) => ({
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
    
  } catch (error) {
    console.error('Pexels API error:', error?.response?.data || error.message)
    return res.status(500).json({ 
      error: 'Failed to fetch content from Pexels',
      details: error?.response?.status === 429 ? 'Rate limit exceeded' : 'Unknown error'
    })
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
