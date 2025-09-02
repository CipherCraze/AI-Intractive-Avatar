// Performance optimization utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

// Suppress console warnings for specific known issues
export function suppressKnownWarnings() {
  const originalWarn = console.warn
  const originalError = console.error
  
  console.warn = (...args) => {
    const message = args.join(' ')
    if (
      message.includes('Intercom') ||
      message.includes('timeout handler') ||
      message.includes('setTimeout') ||
      message.includes('permissions policy')
    ) {
      return // Suppress known warnings
    }
    originalWarn(...args)
  }
  
  console.error = (...args) => {
    const message = args.join(' ')
    if (
      message.includes('Intercom') ||
      message.includes('payment is not allowed')
    ) {
      return // Suppress known errors
    }
    originalError(...args)
  }
}
