import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DynamicBackgroundProps {
  concept: string
  subject: string
  isActive: boolean
  style?: 'subtle' | 'vivid' | 'minimal'
}

interface BackgroundResult {
  success: boolean
  url?: string
  color?: string
  cached?: boolean
  fallback?: boolean
  error?: string
}

export default function DynamicBackground({ 
  concept, 
  subject, 
  isActive, 
  style = 'subtle' 
}: DynamicBackgroundProps) {
  const [background, setBackground] = useState<BackgroundResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!concept || !isActive) {
      setBackground(null)
      return
    }

    generateBackground(concept, subject, style)
  }, [concept, subject, isActive, style])

  const generateBackground = async (concept: string, subject: string, style: string) => {
    setLoading(true)
    setError(null)

    try {
      console.log('[DynamicBackground] Generating for:', concept, subject)
      
      const response = await fetch('/api/generate-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          concept: concept.trim(),
          subject: subject || 'General',
          style
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result: BackgroundResult = await response.json()
      console.log('[DynamicBackground] Result:', result)
      
      setBackground(result)
      
      if (result.success && result.url) {
        // Preload the image
        const img = new Image()
        img.onload = () => console.log('[DynamicBackground] Image preloaded successfully')
        img.onerror = () => console.warn('[DynamicBackground] Failed to load generated image')
        img.src = `http://localhost:5000${result.url}`
      }
    } catch (err) {
      console.error('[DynamicBackground] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate background')
      
      // Fallback to subject-based color
      const fallbackColors = {
        'Biology': '#2d5016',
        'Physics': '#1a1a2e',
        'Chemistry': '#4a1a4a', 
        'Mathematics': '#2c3e50',
        'Computer Science': '#1a1a1a'
      }
      
      setBackground({
        success: false,
        fallback: true,
        color: fallbackColors[subject as keyof typeof fallbackColors] || '#2c3e50'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isActive) {
    return null
  }

  return (
    <div className="absolute inset-0 -z-10">
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
          >
            <div className="text-white/60 text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
              Generating visual for {concept}...
            </div>
          </motion.div>
        )}

        {background && !loading && (
          <motion.div
            key={background.url || background.color || 'fallback'}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.7, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            {background.success && background.url ? (
              <>
                {/* Generated SDXL Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(http://localhost:5000${background.url})`,
                    filter: style === 'subtle' ? 'blur(2px) brightness(0.4)' : 
                            style === 'minimal' ? 'blur(4px) brightness(0.3)' : 
                            'blur(1px) brightness(0.6)'
                  }}
                />
                
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-black/30" />
                
                {/* Cache indicator */}
                {background.cached && (
                  <div className="absolute top-4 right-4 text-xs text-white/50 bg-black/20 px-2 py-1 rounded">
                    Cached
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Fallback Color Background */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${background.color}CC, ${background.color}44)`
                  }}
                />
                
                {/* Subtle pattern overlay */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
                    backgroundSize: '60px 60px'
                  }}
                />
              </>
            )}
          </motion.div>
        )}

        {error && !background && !loading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-gray-900/40"
          />
        )}
      </AnimatePresence>

      {/* Concept label */}
      {background && concept && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute bottom-6 left-6 text-white/70 text-sm font-medium bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm"
        >
          {concept} • {subject}
        </motion.div>
      )}
    </div>
  )
}
