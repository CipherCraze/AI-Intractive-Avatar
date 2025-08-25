import { motion, AnimatePresence } from 'framer-motion'

export default function SlidesPanel({ slides }: { slides: string[] }) {
  return (
    <AnimatePresence>
      {slides && slides.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="absolute top-4 right-4 max-w-sm bg-white/85 backdrop-blur-md border border-black/5 rounded-2xl shadow-xl p-4 z-20"
        >
          <div className="text-xs uppercase tracking-wide text-gray-600 mb-2">Key points</div>
          <ul className="space-y-2 text-gray-800 text-sm list-disc pl-4">
            {slides.slice(0, 6).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

