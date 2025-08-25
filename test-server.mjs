// Simple test server
import http from 'http'

const server = http.createServer((req, res) => {
  console.log(`[test-server] ${req.method} ${req.url}`)
  
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, message: 'Simple test server working' }))
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
  }
})

const PORT = 5001
server.listen(PORT, () => {
  console.log(`[test-server] listening on http://localhost:${PORT}`)
})

server.on('error', (err) => {
  console.error('[test-server] Server error:', err)
})
