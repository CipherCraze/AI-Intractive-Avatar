import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchPexelsContent } from '../lib/api'

interface PexelsBackgroundProps {
	concept: string
	isActive: boolean
	opacity?: number
	className?: string
}

interface PexelsContent {
	id: number
	url: string
	alt?: string
	original?: string
	medium?: string
	small?: string
	width?: number
	height?: number
	duration?: number
	image?: string
}

export default function PexelsBackground({ 
	concept, 
	isActive, 
	opacity = 0.6,
	className = "" 
}: PexelsBackgroundProps) {
	const [content, setContent] = useState<PexelsContent[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [loading, setLoading] = useState(false)
	const [contentType, setContentType] = useState<'photos' | 'videos'>('photos')

	// Map educational concepts to search terms for better results
	const getSearchQuery = (concept: string): string => {
		const conceptMap: Record<string, string> = {
			'Photosynthesis': 'plants green leaves nature sunlight',
			'Coordinate Geometry': 'mathematics geometry graph grid',
			'DNA Structure': 'dna science laboratory molecular biology',
			'Wave Motion': 'ocean waves water physics motion',
			'Binary Search': 'computer technology data network',
			'Chemical Bonding': 'chemistry laboratory molecules atoms',
			'Gravity': 'space earth planet physics',
			'Cell Division': 'microscope cells biology science',
			'Magnetism': 'magnetic field physics science',
			'Electric Current': 'electricity lightning energy physics',
			'Optics': 'light prism rainbow physics optics',
			'Nuclear Physics': 'atom nuclear science physics',
			'Periodic Table': 'chemistry elements science laboratory',
			'Acid Base': 'chemistry laboratory test tubes science',
			'Crystallization': 'crystals minerals geology science',
			'Algebra': 'mathematics equations numbers blackboard',
			'Calculus': 'mathematics graphs functions equations',
			'Trigonometry': 'mathematics angles geometry',
			'Statistics': 'data charts graphs mathematics',
			'Graph Theory': 'network connections mathematics',
			'Data Structures': 'computer programming technology',
			'Algorithms': 'computer code programming technology',
			'Machine Learning': 'artificial intelligence technology computer',
			'Respiration': 'lungs breathing human anatomy',
			'Evolution': 'fossils animals nature evolution',
			'General': 'education learning knowledge books'
		}
		
		return conceptMap[concept] || `${concept} education science`
	}

	useEffect(() => {
		if (!isActive || !concept) return

		const fetchContent = async () => {
			setLoading(true)
			try {
				const query = getSearchQuery(concept)
				
				// Try photos first, then videos if no good photos found
				let result = await fetchPexelsContent(query, 'photos', 8)
				
				if (result.success && result.content.length > 0) {
					setContentType('photos')
					setContent(result.content)
				} else {
					// Fallback to videos if no photos found
					result = await fetchPexelsContent(query, 'videos', 5)
					if (result.success && result.content.length > 0) {
						setContentType('videos')
						setContent(result.content)
					}
				}
				
				setCurrentIndex(0)
			} catch (error) {
				console.error('Failed to fetch Pexels content:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchContent()
	}, [concept, isActive])

	// Auto-rotate through content
	useEffect(() => {
		if (content.length <= 1) return

		const interval = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % content.length)
		}, 8000) // Change every 8 seconds

		return () => clearInterval(interval)
	}, [content.length])

	if (!isActive || loading || content.length === 0) {
		return null
	}

	const currentContent = content[currentIndex]

	return (
		<div className={`absolute inset-0 overflow-hidden ${className}`}>
			<AnimatePresence mode="wait">
				<motion.div
					key={`${currentContent.id}-${currentIndex}`}
					initial={{ opacity: 0, scale: 1.1 }}
					animate={{ opacity: opacity, scale: 1 }}
					exit={{ opacity: 0, scale: 0.9 }}
					transition={{ duration: 1.5, ease: "easeInOut" }}
					className="absolute inset-0"
				>
					{contentType === 'videos' ? (
						<video
							src={currentContent.url}
							className="w-full h-full object-cover"
							autoPlay
							muted
							loop
							playsInline
						/>
					) : (
						<img
							src={currentContent.url}
							alt={currentContent.alt || concept}
							className="w-full h-full object-cover"
							loading="lazy"
						/>
					)}
					
					{/* Gradient overlay for better text readability */}
					<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
				</motion.div>
			</AnimatePresence>

			{/* Content indicators */}
			{content.length > 1 && (
				<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
					{content.map((_, index) => (
						<button
							key={index}
							onClick={() => setCurrentIndex(index)}
							className={`w-2 h-2 rounded-full transition-all duration-300 ${
								index === currentIndex 
									? 'bg-white scale-125' 
									: 'bg-white/50 hover:bg-white/70'
							}`}
						/>
					))}
				</div>
			)}

			{/* Content type indicator */}
			<div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs z-10">
				{contentType === 'videos' ? '🎥' : '📸'} {concept}
			</div>

			{/* Manual navigation buttons */}
			{content.length > 1 && (
				<>
					<button
						onClick={() => setCurrentIndex((prev) => (prev - 1 + content.length) % content.length)}
						className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 z-10"
						aria-label="Previous background"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<button
						onClick={() => setCurrentIndex((prev) => (prev + 1) % content.length)}
						className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 z-10"
						aria-label="Next background"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</>
			)}
		</div>
	)
}
