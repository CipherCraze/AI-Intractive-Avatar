import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { suppressKnownWarnings } from './lib/performance'

// Suppress known console warnings for better development experience
if (import.meta.env.DEV) {
  suppressKnownWarnings()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
)
