console.log('[dev-server] Starting server...')

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

console.log('[dev-server] Imports loaded successfully')

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') })

console.log('[dev-server] Environment loaded')

const app = express()
app.use(cors())
app.use(express.json())

console.log('[dev-server] Express app configured')

// Clean and validate environment variables
const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim().replace(/['"]/g, '')
const HEYGEN_KEY = (process.env.HEYGEN_API_KEY || '').trim().replace(/['"]/g, '')
const HEYGEN_AVATAR = (process.env.HEYGEN_AVATAR_ID || '').trim().replace(/['"]/g, '')
const HEYGEN_VOICE = (process.env.HEYGEN_VOICE_ID || 'en-US').trim().replace(/['"]/g, '')
const HF_TOKEN = (process.env.HF_API_TOKEN || '').trim().replace(/['"]/g, '')

const hasGemini = GEMINI_KEY.length > 10
const hasHeygen = HEYGEN_KEY.length > 10 && HEYGEN_AVATAR.length > 10
const hasHuggingFace = HF_TOKEN.length > 10

console.log('[debug] GEMINI_API_KEY:', hasGemini ? 'Set ✓' : 'Missing ✗')
console.log('[debug] HEYGEN_API_KEY:', hasHeygen ? 'Set ✓' : 'Missing ✗')
console.log('[debug] HEYGEN_AVATAR_ID:', HEYGEN_AVATAR ? 'Set ✓' : 'Missing ✗')
console.log('[debug] HF_API_TOKEN:', hasHuggingFace ? 'Set ✓' : 'Missing ✗')

const genAI = hasGemini ? new GoogleGenerativeAI(GEMINI_KEY) : null
const model = hasGemini ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null

// SDXL Image Generation Setup
const GENERATED_DIR = path.join(process.cwd(), 'dev-server', 'generated')
if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true })
  console.log('[sdxl] Created generated assets directory:', GENERATED_DIR)
}

const IMAGE_CACHE = new Map() // key -> { path, expiresAt, prompt }
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 // 24 hours cache

function cacheKeyFor(prompt, opts = {}) {
  return crypto.createHash('sha256').update(JSON.stringify({ prompt, ...opts })).digest('hex')
}

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
			hasHuggingFace,
			nodeVersion: process.version
		}
	})
})

function buildMock(question) {
  const concept = (question || 'General').split(/\s+/).slice(0, 2).join(' ') || 'General'
  
  // Create more realistic educational content based on the question
  const mockContent = {
    'photosynthesis': {
      answer: `Photosynthesis is the process where plants convert sunlight into energy. Plants use chlorophyll in their leaves to capture light energy, combine carbon dioxide from the air with water from their roots, and create glucose (sugar) while releasing oxygen as a byproduct. This process is essential for all life on Earth as it produces the oxygen we breathe and forms the base of the food chain.`,
      subject: 'Biology',
      difficulty: 'beginner',
      slides: [
        'Plants capture sunlight using chlorophyll',
        'Carbon dioxide enters through leaf pores',
        'Water travels up from roots to leaves', 
        'Glucose is produced as plant food',
        'Oxygen is released as a byproduct'
      ]
    },
    'gravity': {
      answer: `Gravity is a fundamental force of nature that attracts objects with mass toward each other. The more massive an object, the stronger its gravitational pull. On Earth, gravity gives weight to objects and causes them to fall toward the ground when dropped. This force keeps planets in orbit around the sun and is responsible for many phenomena we observe in our daily lives.`,
      subject: 'Physics',
      difficulty: 'beginner',
      slides: [
        'Gravity attracts objects with mass',
        'Larger masses have stronger gravity',
        'Earth\'s gravity pulls objects downward',
        'Gravity keeps planets in orbit',
        'Weight is the effect of gravity on mass'
      ]
    }
  }
  
  const key = concept.toLowerCase()
  const mock = mockContent[key] || {
    answer: `Here is an educational explanation of ${concept}. This content demonstrates the app's capabilities when API keys are properly configured.`,
    subject: 'General',
    difficulty: 'beginner',
    slides: [
      `Introduction to ${concept}`,
      'Key concepts and principles',
      'Practical applications',
      'Summary and review'
    ]
  }
  
  return {
    answer: mock.answer,
    concept,
    difficulty: mock.difficulty,
    subject: mock.subject,
    slides: mock.slides,
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

// SDXL Image Generation Functions
async function fetchHFImage(prompt, model = 'stabilityai/stable-diffusion-xl-base-1.0', options = {}) {
  const key = cacheKeyFor(prompt, { model, ...options })
  const cached = IMAGE_CACHE.get(key)
  
  // Check cache first
  if (cached && cached.expiresAt > Date.now() && fs.existsSync(cached.path)) {
    console.log('[sdxl] Using cached image for:', prompt.slice(0, 50) + '...')
    return { cached: true, filePath: cached.path, url: `/generated/${path.basename(cached.path)}` }
  }

  if (!hasHuggingFace) {
    throw new Error('HuggingFace API token not configured')
  }

  console.log('[sdxl] Generating image for:', prompt.slice(0, 50) + '...')
  
  const res = await axios({
    method: 'POST',
    url: `https://api-inference.huggingface.co/models/${model}`,
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json'
    },
    data: {
      inputs: prompt,
      parameters: { 
        guidance_scale: options.guidance || 7.5, 
        width: options.width || 1024, 
        height: options.height || 1024,
        num_inference_steps: options.steps || 20
      }
    },
    responseType: 'arraybuffer',
    timeout: 60000 // 60 seconds for image generation
  })

  if (res.status !== 200) {
    throw new Error(`HF image generation failed: ${res.status}`)
  }

  const fileName = `${key}.png`
  const filePath = path.join(GENERATED_DIR, fileName)
  fs.writeFileSync(filePath, res.data)

  const cacheEntry = { 
    path: filePath, 
    expiresAt: Date.now() + CACHE_TTL_MS,
    prompt: prompt.slice(0, 100)
  }
  IMAGE_CACHE.set(key, cacheEntry)
  
  console.log('[sdxl] Image generated and cached:', fileName)
  return { cached: false, filePath, url: `/generated/${fileName}` }
}

function generateEducationalPrompt(concept, subject) {
  const basePrompts = {
    'Biology': `detailed scientific diagram of ${concept}, labeled parts, clean educational illustration, high contrast, biology textbook style`,
    'Physics': `physics diagram showing ${concept}, mathematical formulas, vectors, clean scientific illustration, educational poster style`,
    'Chemistry': `chemistry diagram of ${concept}, molecular structures, chemical equations, laboratory style, educational illustration`,
    'Mathematics': `mathematical visualization of ${concept}, geometric shapes, coordinate grids, clean diagram, educational math textbook style`,
    'Computer Science': `technical diagram illustrating ${concept}, flowcharts, data structures, clean modern design, programming concept visualization`,
    'General': `educational illustration of ${concept}, clean diagram, informative design, suitable for learning`
  }
  
  return basePrompts[subject] || basePrompts['General']
}

app.post('/api/ask', async (req, res) => {
  const { question, backgroundPreference } = req.body || {}
  if (!question) return res.status(400).json({ error: 'Missing question' })

  try {
    let answer = ''
    let concept = ''
    let slides = []
    let difficulty = 'beginner'
    let subject = 'General'
    let interactiveElements = []

    // Try Gemini API if available
    if (hasGemini) {
      try {
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

QUESTION: ${question}`

        console.log('[api/ask] Calling Gemini API...')
        const result = await callGeminiWithRetry(prompt)
        const text = result

        try { 
          const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const parsed = JSON.parse(cleanText)
          
          answer = (parsed.answer || '').slice(0, 2000)
          concept = (parsed.concept || extractConceptFromQuestion(question)).slice(0, 64)
          difficulty = parsed.difficulty || 'beginner'
          subject = parsed.subject || 'General'
          interactiveElements = Array.isArray(parsed.interactiveElements) ? parsed.interactiveElements : []
          slides = Array.isArray(parsed.slides) && parsed.slides.length ? 
            parsed.slides.slice(0, 6) : 
            generateDefaultSlides(concept)
          
          console.log(`[Gemini] Generated content for: ${concept} (${subject}, ${difficulty} level)`)
        } catch (parseError) { 
          console.log('[api/ask] Failed to parse Gemini response, using extracted content')
          const mockData = buildMock(question)
          answer = text.slice(0, 2000)
          concept = mockData.concept
          slides = mockData.slides
          difficulty = mockData.difficulty
          subject = mockData.subject
          interactiveElements = mockData.interactiveElements
        }
      } catch (geminiError) {
        console.log('[api/ask] Gemini error, using mock:', geminiError.message)
        const mockData = buildMock(question)
        answer = mockData.answer
        concept = mockData.concept
        slides = mockData.slides
        difficulty = mockData.difficulty
        subject = mockData.subject
        interactiveElements = mockData.interactiveElements
      }
    } else {
      console.log('[api/ask] Gemini not available, using mock response')
      const mockData = buildMock(question)
      answer = mockData.answer
      concept = mockData.concept
      slides = mockData.slides
      difficulty = mockData.difficulty
      subject = mockData.subject
      interactiveElements = mockData.interactiveElements
    }

    // Try HeyGen API if available
    let videoUrl = null
    let jobId = null
    
    if (hasHeygen && answer) {
      try {
        console.log('[api/ask] Generating HeyGen video...')
        
        // Enhanced background selection based on subject and content
        const bgPref = backgroundPreference || 'auto'
        let background = { type: 'transparent' }
        
        if (bgPref === 'green') {
          background = { type: 'color', value: '#00FF00' }
        } else if (bgPref === 'auto') {
          background = getSmartBackground(subject, concept)
        }

        const startRes = await axios.post(
          'https://api.heygen.com/v2/video/generate',
          {
            video_inputs: [
              {
                character: { type: 'avatar', avatar_id: HEYGEN_AVATAR, avatar_style: 'normal' },
                voice: { type: 'text', input_text: answer, voice_id: HEYGEN_VOICE },
                background,
              },
            ],
            dimension: { width: 1280, height: 720 },
          },
          {
            headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' },
            timeout: 30000,
          }
        )

        videoUrl = startRes?.data?.data?.video_url || null
        jobId = startRes?.data?.data?.video_id || startRes?.data?.data?.task_id || null

        console.log('[api/ask] HeyGen video generation started:', { videoUrl, jobId })
      } catch (heygenError) {
        console.log('[api/ask] HeyGen error:', heygenError.message)
        // Continue without video
      }
    } else {
      console.log('[api/ask] HeyGen not available, skipping video generation')
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
      { headers: { 'X-Api-Key': HEYGEN_KEY }, timeout: 15000 }
    )
    return res.status(200).json(poll.data)
  } catch (err) {
    console.error(err?.response?.data || err?.message || err)
    return res.status(500).json({ error: 'Failed to fetch status' })
  }
})

// SDXL Image Generation Endpoint
app.post('/api/generate-background', async (req, res) => {
  try {
    const { concept, subject, style } = req.body || {}
    if (!concept) {
      return res.status(400).json({ error: 'Concept is required' })
    }

    const prompt = generateEducationalPrompt(concept, subject || 'General')
    console.log('[api/generate-background] Generating for:', concept, '->', prompt.slice(0, 80) + '...')

    try {
      const result = await fetchHFImage(prompt, 'stabilityai/stable-diffusion-xl-base-1.0', {
        width: 1280,
        height: 720,
        guidance: 7.5
      })

      return res.json({
        success: true,
        url: result.url,
        cached: result.cached,
        concept,
        prompt: prompt.slice(0, 100) + '...'
      })
    } catch (hfError) {
      console.log('[api/generate-background] HF error:', hfError.message)
      
      // Fallback to a simple colored background based on subject
      const fallbackColors = {
        'Biology': '#2d5016',
        'Physics': '#1a1a2e', 
        'Chemistry': '#4a1a4a',
        'Mathematics': '#2c3e50',
        'Computer Science': '#1a1a1a'
      }
      
      return res.json({
        success: false,
        fallback: true,
        color: fallbackColors[subject] || '#2c3e50',
        error: hfError.message.includes('token') ? 'HuggingFace API token required' : 'Image generation temporarily unavailable',
        concept
      })
    }
  } catch (error) {
    console.error('[api/generate-background] Error:', error)
    return res.status(500).json({ 
      error: 'Failed to generate background',
      details: error.message 
    })
  }
})

// Serve generated static files
app.use('/generated', express.static(GENERATED_DIR))

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
	console.log(`  - GEMINI_API_KEY: ${hasGemini ? 'Set ✓' : 'Missing ✗'}`)
	console.log(`  - HEYGEN_API_KEY: ${hasHeygen ? 'Set ✓' : 'Missing ✗'}`)
	console.log(`  - HEYGEN_AVATAR_ID: ${HEYGEN_AVATAR ? 'Set ✓' : 'Missing ✗'}`)
	console.log(`  - HF_API_TOKEN: ${hasHuggingFace ? 'Set ✓' : 'Missing ✗'}`)
	console.log(`[dev-server] Ready to serve requests!`)
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
