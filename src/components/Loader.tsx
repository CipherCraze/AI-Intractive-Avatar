export default function Loader() {
  return (
    <div className="flex items-center gap-2 text-white/90">
      <span className="inline-block h-2 w-2 bg-white/80 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
      <span className="inline-block h-2 w-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
      <span className="inline-block h-2 w-2 bg-white/40 rounded-full animate-bounce"></span>
      <span className="ml-2">Generating avatar...</span>
    </div>
  )
}

