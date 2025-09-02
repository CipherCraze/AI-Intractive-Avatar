interface SimpleSlidesDeckProps {
  title: string
  bullets: string[]
}

export default function SimpleSlidesDeck({ title, bullets }: SimpleSlidesDeckProps) {
  if (!bullets || bullets.length === 0) return null
  
  return (
    <div className="hidden lg:block absolute inset-y-4 left-4 right-4 z-20 pointer-events-none">
      <div className="pointer-events-auto rounded-2xl overflow-hidden shadow-2xl border border-black/10 bg-white/95 backdrop-blur-sm max-h-96">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {title || 'Overview'}
          </h2>
          <ul className="space-y-2">
            {bullets.slice(0, 6).map((bullet, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm leading-relaxed">
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
