import { useState } from 'react'
import { ask } from '../lib/api'
import { useChatStore } from '../store/useChatStore'
import { motion } from 'framer-motion'

// Sample educational topics for quick access
const sampleTopics = [
	'Explain photosynthesis',
	'How does coordinate geometry work?',
	'What is DNA structure?',
	'Explain wave motion',
	'How does binary search work?',
	'What is chemical bonding?',
	'Explain gravity and forces'
]

export default function Chat() {
	const [input, setInput] = useState('')
	const { messages, addMessage, setLoading, setAvatar, setSlides, loading } = useChatStore()

	const send = async (question?: string) => {
		const q = (question || input.trim())
		if (!q) return
		
		addMessage({ role: 'user', text: q })
		setInput('')
		setLoading(true)
		
		try {
			const { 
				answer, 
				concept, 
				slides, 
				videoUrl, 
				difficulty, 
				subject, 
				interactiveElements 
			} = await ask(q, 'auto')
			
			addMessage({ role: 'bot', text: answer })
			setSlides(slides || [])
			setAvatar({ 
				videoUrl, 
				concept, 
				difficulty, 
				subject, 
				interactiveElements 
			})
		} catch (e: any) {
			console.error('API Error:', e)
			let errorMessage = 'Sorry, I could not reach the tutor service. Please try again.'
			
			// Provide more specific error messages
			if (e?.code === 'NETWORK_ERROR' || e?.message?.includes('Network Error')) {
				errorMessage = 'Network connection failed. Please check if the server is running on http://localhost:5000'
			} else if (e?.response?.status === 500) {
				errorMessage = 'Server error occurred. The AI service might be temporarily unavailable.'
			} else if (e?.response?.status === 400) {
				errorMessage = 'Invalid request. Please try rephrasing your question.'
			} else if (e?.message) {
				errorMessage = `Error: ${e.message}`
			}
			
			addMessage({ 
				role: 'bot', 
				text: errorMessage
			})
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex flex-col h-full">
			{/* Chat Messages */}
			<div className="flex-1 overflow-y-auto space-y-3 p-4 bg-white rounded-lg border shadow-sm">
				{messages.length === 0 && (
					<div className="text-center text-gray-500 py-8">
						<div className="text-4xl mb-3">🎓</div>
						<h3 className="text-lg font-medium mb-2">Welcome to AI Tutor!</h3>
						<p className="text-sm mb-4">Ask me anything about science, math, or technology</p>
						
						{/* Quick Topic Buttons */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
							{sampleTopics.slice(0, 4).map((topic, i) => (
								<button
									key={i}
									onClick={() => send(topic)}
									disabled={loading}
									className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-full transition-colors disabled:opacity-50"
								>
									{topic}
								</button>
							))}
						</div>
					</div>
				)}
				
				{messages.map((m, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
					>
						<div className={`max-w-[80%] p-3 rounded-lg ${
							m.role === 'user' 
								? 'bg-blue-500 text-white rounded-br-sm' 
								: 'bg-gray-100 text-gray-800 rounded-bl-sm'
						}`}>
							<div className="flex items-start gap-2">
								<span className="text-lg">
									{m.role === 'user' ? '👤' : '🤖'}
								</span>
								<p className="text-sm leading-relaxed">{m.text}</p>
							</div>
						</div>
					</motion.div>
				))}
				
				{loading && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex justify-start"
					>
						<div className="bg-gray-100 p-3 rounded-lg rounded-bl-sm">
							<div className="flex items-center gap-2">
								<span className="text-lg">🤖</span>
								<div className="flex gap-1">
									<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
									<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
									<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
								</div>
								<span className="text-sm text-gray-600">Thinking...</span>
							</div>
						</div>
					</motion.div>
				)}
			</div>
			
			{/* Input Area */}
			<div className="mt-4 space-y-3">
				{/* Quick Topics (when chat has started) */}
				{messages.length > 0 && (
					<div className="flex flex-wrap gap-2">
						<span className="text-xs text-gray-500 self-center">Try:</span>
						{sampleTopics.slice(4).map((topic, i) => (
							<button
								key={i}
								onClick={() => send(topic)}
								disabled={loading}
								className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-full transition-colors disabled:opacity-50"
							>
								{topic}
							</button>
						))}
					</div>
				)}
				
				{/* Input Form */}
				<div className="flex gap-2">
					<input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
						placeholder="Ask me anything about science, math, or technology..."
						onKeyDown={(e) => e.key === 'Enter' && !loading && send()}
						disabled={loading}
					/>
					<button 
						onClick={() => send()} 
						disabled={loading || !input.trim()}
						className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
					>
						{loading ? (
							<>
								<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
								<span>Asking...</span>
							</>
						) : (
							<>
								<span>Ask</span>
								<span>🚀</span>
							</>
						)}
					</button>
				</div>
				
				{/* Tip */}
				<p className="text-xs text-gray-500 text-center">
					💡 Try asking about specific topics like "photosynthesis", "coordinate geometry", or "wave motion" for interactive experiences!
				</p>
			</div>
		</div>
	)
}
