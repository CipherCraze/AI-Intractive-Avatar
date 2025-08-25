import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface InteractiveVisualizationProps {
	concept: string
	isActive: boolean
	onInteraction?: (data: any) => void
}

// Topic-specific visualization components
const visualizations = {
	'Coordinate Geometry': CoordinateGeometry,
	'Photosynthesis': PhotosynthesisFlow,
	'Chemical Bonding': ChemicalBonds,
	'Wave Motion': WaveVisualization,
	'Binary Search': BinarySearchTree,
}

export default function InteractiveVisualization({ 
	concept, 
	isActive,
	onInteraction 
}: InteractiveVisualizationProps) {
	const VisualizationComponent = visualizations[concept as keyof typeof visualizations]
	
	if (!VisualizationComponent || !isActive) return null
	
	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
				className="absolute inset-0 z-5 pointer-events-auto"
			>
				<VisualizationComponent onInteraction={onInteraction} />
			</motion.div>
		</AnimatePresence>
	)
}

// Coordinate Geometry Interactive Component
function CoordinateGeometry({ onInteraction }: { onInteraction?: (data: any) => void }) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [points, setPoints] = useState<{ x: number; y: number }[]>([])
	
	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		
		const ctx = canvas.getContext('2d')
		if (!ctx) return
		
		// Set canvas size
		canvas.width = canvas.offsetWidth
		canvas.height = canvas.offsetHeight
		
		// Draw coordinate system
		const centerX = canvas.width / 2
		const centerY = canvas.height / 2
		const scale = 20
		
		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		
		// Draw grid
		ctx.strokeStyle = '#333'
		ctx.lineWidth = 0.5
		for (let i = -20; i <= 20; i++) {
			// Vertical lines
			ctx.beginPath()
			ctx.moveTo(centerX + i * scale, 0)
			ctx.lineTo(centerX + i * scale, canvas.height)
			ctx.stroke()
			
			// Horizontal lines
			ctx.beginPath()
			ctx.moveTo(0, centerY + i * scale)
			ctx.lineTo(canvas.width, centerY + i * scale)
			ctx.stroke()
		}
		
		// Draw axes
		ctx.strokeStyle = '#666'
		ctx.lineWidth = 2
		// X-axis
		ctx.beginPath()
		ctx.moveTo(0, centerY)
		ctx.lineTo(canvas.width, centerY)
		ctx.stroke()
		
		// Y-axis
		ctx.beginPath()
		ctx.moveTo(centerX, 0)
		ctx.lineTo(centerX, canvas.height)
		ctx.stroke()
		
		// Draw points
		ctx.fillStyle = '#3b82f6'
		points.forEach(point => {
			ctx.beginPath()
			ctx.arc(centerX + point.x * scale, centerY - point.y * scale, 5, 0, 2 * Math.PI)
			ctx.fill()
		})
		
		// Draw line if we have multiple points
		if (points.length > 1) {
			ctx.strokeStyle = '#ef4444'
			ctx.lineWidth = 2
			ctx.beginPath()
			ctx.moveTo(centerX + points[0].x * scale, centerY - points[0].y * scale)
			for (let i = 1; i < points.length; i++) {
				ctx.lineTo(centerX + points[i].x * scale, centerY - points[i].y * scale)
			}
			ctx.stroke()
		}
	}, [points])
	
	const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current
		if (!canvas) return
		
		const rect = canvas.getBoundingClientRect()
		const centerX = canvas.width / 2
		const centerY = canvas.height / 2
		const scale = 20
		
		const x = Math.round((e.clientX - rect.left - centerX) / scale)
		const y = Math.round((centerY - (e.clientY - rect.top)) / scale)
		
		const newPoints = [...points, { x, y }]
		setPoints(newPoints)
		onInteraction?.({ type: 'point_added', points: newPoints, lastPoint: { x, y } })
	}
	
	return (
		<div className="w-full h-full bg-black/80 flex flex-col">
			<div className="p-4 text-white">
				<h3 className="text-lg font-bold mb-2">📐 Interactive Coordinate Geometry</h3>
				<p className="text-sm text-gray-300 mb-4">Click to add points and see the line graph</p>
				<div className="flex gap-2 mb-4">
					<button
						onClick={() => setPoints([])}
						className="bg-red-500/80 hover:bg-red-500 px-3 py-1 rounded text-sm transition-colors"
					>
						Clear Points
					</button>
					<span className="text-sm text-gray-400">Points: {points.length}</span>
				</div>
			</div>
			<canvas
				ref={canvasRef}
				onClick={handleCanvasClick}
				className="flex-1 cursor-crosshair"
				style={{ width: '100%', height: '100%' }}
			/>
		</div>
	)
}

// Photosynthesis Flow Visualization
function PhotosynthesisFlow({ onInteraction }: { onInteraction?: (data: any) => void }) {
	const [stage, setStage] = useState(0)
	const stages = [
		{ name: 'Light Absorption', icon: '☀️', color: 'bg-yellow-500' },
		{ name: 'Water Splitting', icon: '💧', color: 'bg-blue-500' },
		{ name: 'Carbon Fixation', icon: '🌱', color: 'bg-green-500' },
		{ name: 'Glucose Formation', icon: '🍯', color: 'bg-orange-500' }
	]
	
	useEffect(() => {
		const interval = setInterval(() => {
			setStage(prev => (prev + 1) % stages.length)
			onInteraction?.({ type: 'stage_change', stage: stages[stage] })
		}, 3000)
		
		return () => clearInterval(interval)
	}, [stage])
	
	return (
		<div className="w-full h-full bg-gradient-to-b from-green-900/80 to-blue-900/80 flex flex-col items-center justify-center text-white">
			<h3 className="text-xl font-bold mb-8">🌿 Photosynthesis Process</h3>
			<div className="grid grid-cols-2 gap-6 max-w-md">
				{stages.map((stageInfo, index) => (
					<motion.div
						key={index}
						className={`p-4 rounded-lg text-center ${stageInfo.color} ${
							stage === index ? 'ring-4 ring-white' : 'opacity-50'
						}`}
						animate={{
							scale: stage === index ? 1.1 : 1,
							opacity: stage === index ? 1 : 0.5
						}}
						transition={{ duration: 0.5 }}
					>
						<div className="text-3xl mb-2">{stageInfo.icon}</div>
						<div className="text-sm font-medium">{stageInfo.name}</div>
					</motion.div>
				))}
			</div>
			<div className="mt-8 text-center">
				<div className="text-lg font-medium">{stages[stage].name}</div>
				<div className="w-32 h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
					<motion.div
						className="h-full bg-white"
						initial={{ width: 0 }}
						animate={{ width: `${((stage + 1) / stages.length) * 100}%` }}
						transition={{ duration: 0.5 }}
					/>
				</div>
			</div>
		</div>
	)
}

// Placeholder components for other topics
function ChemicalBonds({ onInteraction: _onInteraction }: { onInteraction?: (data: any) => void }) {
	return (
		<div className="w-full h-full bg-purple-900/80 flex items-center justify-center text-white">
			<div className="text-center">
				<div className="text-4xl mb-4">⚛️</div>
				<h3 className="text-xl font-bold">Chemical Bonding</h3>
				<p className="text-gray-300">Interactive molecular visualization</p>
			</div>
		</div>
	)
}

function WaveVisualization({ onInteraction: _onInteraction }: { onInteraction?: (data: any) => void }) {
	return (
		<div className="w-full h-full bg-indigo-900/80 flex items-center justify-center text-white">
			<div className="text-center">
				<div className="text-4xl mb-4">🌊</div>
				<h3 className="text-xl font-bold">Wave Motion</h3>
				<p className="text-gray-300">Interactive wave simulation</p>
			</div>
		</div>
	)
}

function BinarySearchTree({ onInteraction: _onInteraction }: { onInteraction?: (data: any) => void }) {
	return (
		<div className="w-full h-full bg-gray-900/80 flex items-center justify-center text-white">
			<div className="text-center">
				<div className="text-4xl mb-4">🌳</div>
				<h3 className="text-xl font-bold">Binary Search</h3>
				<p className="text-gray-300">Interactive tree visualization</p>
			</div>
		</div>
	)
}
