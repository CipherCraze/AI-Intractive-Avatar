import AnimationLayer from './AnimationLayer'
import InteractiveVisualization from './InteractiveVisualization'
import { useChatStore } from '../store/useChatStore'
import { motion } from 'framer-motion'
import Loader from './Loader'
import SlidesPanel from './SlidesPanel'
import SlidesDeck from './SlidesDeck'
import { useEffect, useRef, useState } from 'react'

export default function AvatarStage() {
	const { 
		avatar, 
		loading, 
		slides, 
		isAvatarSpeaking, 
		setAvatarSpeaking, 
		setAnimationEvent 
	} = useChatStore()
	
	const videoRef = useRef<HTMLVideoElement>(null)
	const [showInteractiveMode, setShowInteractiveMode] = useState(false)
	
	// Track video playback to sync with animations
	useEffect(() => {
		const video = videoRef.current
		if (!video) return
		
		const handlePlay = () => setAvatarSpeaking(true)
		const handlePause = () => setAvatarSpeaking(false)
		const handleEnded = () => setAvatarSpeaking(false)
		
		video.addEventListener('play', handlePlay)
		video.addEventListener('pause', handlePause)
		video.addEventListener('ended', handleEnded)
		
		return () => {
			video.removeEventListener('play', handlePlay)
			video.removeEventListener('pause', handlePause)
			video.removeEventListener('ended', handleEnded)
		}
	}, [avatar.videoUrl, setAvatarSpeaking])
	
	const handleAnimationEvent = (event: string) => {
		setAnimationEvent(event)
		
		// You can add custom logic based on animation events
		if (event === 'animation_complete' && avatar.concept) {
			console.log(`Animation for ${avatar.concept} completed`)
		}
	}
	
	const handleVisualizationInteraction = (data: any) => {
		console.log('Visualization interaction:', data)
		// You can log user interactions for analytics or trigger other features
	}
	
	// Check if the current concept supports interactive visualization
	const hasInteractiveVisualization = avatar.concept && [
		'Coordinate Geometry', 'Photosynthesis', 'Chemical Bonding', 
		'Wave Motion', 'Binary Search'
	].includes(avatar.concept)
	
	return (
		<div className="relative w-full h-[28rem] bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
			{/* Enhanced Animation Layer with interactivity */}
			<AnimationLayer 
				concept={avatar.concept} 
				isAvatarSpeaking={isAvatarSpeaking}
				onAnimationEvent={handleAnimationEvent}
			/>
			
			{/* Interactive Visualization Layer */}
			{hasInteractiveVisualization && (
				<InteractiveVisualization
					concept={avatar.concept}
					isActive={showInteractiveMode}
					onInteraction={handleVisualizationInteraction}
				/>
			)}
			
			{/* Slides Components */}
			<SlidesDeck title={avatar.concept || 'Key Concepts'} bullets={slides} />
			<SlidesPanel slides={slides} />
			
			{/* Avatar Video */}
			{avatar.videoUrl && !showInteractiveMode && (
				<motion.video
					ref={videoRef}
					key={avatar.videoUrl}
					src={avatar.videoUrl}
					autoPlay
					controls
					className="relative z-10 w-full h-full object-contain backdrop-blur-sm"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					style={{
						// Blend mode for better integration with background animations
						mixBlendMode: avatar.concept ? 'screen' : 'normal'
					}}
				/>
			)}
			
			{/* Loading State */}
			{!avatar.videoUrl && !showInteractiveMode && (
				<div className="relative z-10 w-full h-full flex items-center justify-center">
					{loading ? (
						<Loader />
					) : (
						<div className="text-white/80 text-sm flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full">
							<span>⚠</span>
							<span>Ask a question to start</span>
						</div>
					)}
				</div>
			)}
			
			{/* Interactive Mode Toggle */}
			{hasInteractiveVisualization && (
				<motion.button
					onClick={() => setShowInteractiveMode(!showInteractiveMode)}
					className="absolute top-4 right-4 bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-sm rounded-full px-4 py-2 text-white text-xs font-medium shadow-lg z-30 hover:from-purple-600/80 hover:to-pink-600/80 transition-all"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
				>
					{showInteractiveMode ? '🎬 Show Avatar' : '🎮 Interactive Mode'}
				</motion.button>
			)}
			
			{/* Topic Status Indicator */}
			{avatar.concept && (
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					className="absolute bottom-4 left-4 bg-gradient-to-r from-indigo-500/80 to-purple-500/80 backdrop-blur-sm rounded-full px-4 py-2 text-white text-xs font-medium shadow-lg z-30"
				>
					<div className="flex items-center gap-2">
						<span>🎯 {avatar.concept}</span>
						{avatar.subject && avatar.subject !== 'General' && (
							<span className="bg-white/20 px-2 py-1 rounded-full text-xs">
								{avatar.subject}
							</span>
						)}
						{avatar.difficulty && (
							<span className={`px-2 py-1 rounded-full text-xs ${
								avatar.difficulty === 'beginner' ? 'bg-green-500/80' :
								avatar.difficulty === 'intermediate' ? 'bg-yellow-500/80' :
								'bg-red-500/80'
							}`}>
								{avatar.difficulty}
							</span>
						)}
					</div>
					{isAvatarSpeaking && !showInteractiveMode && (
						<motion.div
							className="inline-block ml-2 w-2 h-2 bg-green-400 rounded-full"
							animate={{ scale: [1, 1.2, 1] }}
							transition={{ repeat: Infinity, duration: 1 }}
						/>
					)}
					{showInteractiveMode && (
						<motion.div
							className="inline-block ml-2 w-2 h-2 bg-purple-400 rounded-full"
							animate={{ opacity: [1, 0.5, 1] }}
							transition={{ repeat: Infinity, duration: 2 }}
						/>
					)}
				</motion.div>
			)}
		</div>
	)
}
