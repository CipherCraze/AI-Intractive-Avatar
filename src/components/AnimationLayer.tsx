import { Player } from '@lottiefiles/react-lottie-player'
import { animationMap } from '../lib/animationMap'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnimationLayerProps {
	concept?: string
	isAvatarSpeaking?: boolean
	onAnimationEvent?: (event: string) => void
}

export default function AnimationLayer({ 
	concept, 
	isAvatarSpeaking = false,
	onAnimationEvent 
}: AnimationLayerProps) {
	const [showControls, setShowControls] = useState(false)
	const [isPlaying, setIsPlaying] = useState(true)
	const [animationSpeed, setAnimationSpeed] = useState(1)
	const playerRef = useRef<any>(null)
	
	const src = concept && animationMap[concept] ? animationMap[concept] : animationMap['General']
	
	// Auto-play when avatar starts speaking about new topic
	useEffect(() => {
		if (isAvatarSpeaking && playerRef.current) {
			setIsPlaying(true)
			playerRef.current.play()
			onAnimationEvent?.('topic_started')
		}
	}, [concept, isAvatarSpeaking, onAnimationEvent])
	
	const handlePlayPause = () => {
		if (playerRef.current) {
			if (isPlaying) {
				playerRef.current.pause()
			} else {
				playerRef.current.play()
			}
			setIsPlaying(!isPlaying)
		}
	}
	
	const handleSpeedChange = (speed: number) => {
		setAnimationSpeed(speed)
		if (playerRef.current) {
			playerRef.current.setPlayerSpeed(speed)
		}
	}
	
	const handleAnimationComplete = () => {
		onAnimationEvent?.('animation_complete')
	}

	return (
		<div 
			className="absolute inset-0 w-full h-full group"
			onMouseEnter={() => setShowControls(true)}
			onMouseLeave={() => setShowControls(false)}
		>
			<Player
				ref={playerRef}
				autoplay={isPlaying}
				loop={true}
				src={src}
				speed={animationSpeed}
				className="absolute inset-0 w-full h-full"
				onEvent={(event) => {
					if (event === 'complete') handleAnimationComplete()
				}}
			/>
			
			{/* Interactive Controls Overlay */}
			<AnimatePresence>
				{showControls && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
						className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white text-sm"
					>
						<div className="flex items-center justify-between mb-2">
							<span className="font-medium">{concept || 'General'} Animation</span>
							<div className="flex items-center gap-2">
								{/* Play/Pause Button */}
								<button
									onClick={handlePlayPause}
									className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
								>
									{isPlaying ? '⏸️' : '▶️'}
								</button>
							</div>
						</div>
						
						{/* Speed Control */}
						<div className="flex items-center gap-3">
							<span className="text-xs">Speed:</span>
							<div className="flex gap-1">
								{[0.5, 1, 1.5, 2].map(speed => (
									<button
										key={speed}
										onClick={() => handleSpeedChange(speed)}
										className={`px-2 py-1 rounded text-xs transition-colors ${
											animationSpeed === speed 
												? 'bg-blue-500 text-white' 
												: 'bg-white/20 hover:bg-white/30'
										}`}
									>
										{speed}x
									</button>
								))}
							</div>
						</div>
						
						{/* Topic Indicator */}
						{isAvatarSpeaking && (
							<div className="mt-2 flex items-center gap-2 text-xs text-green-300">
								<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
								Avatar is explaining this concept
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
			
			{/* Topic Transition Effect */}
			<AnimatePresence>
				{concept && (
					<motion.div
						key={concept}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 1.2 }}
						className="absolute top-4 left-4 bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-medium shadow-lg"
					>
						📚 {concept}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

