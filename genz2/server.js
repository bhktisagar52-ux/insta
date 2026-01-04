const express = require('express')
const { createServer } = require('http')
const next = require('next')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()

  // Serve static files from .next/static
  server.use('/_next/static', express.static(path.join(__dirname, '.next/static')))

  // Handle all other requests with Next.js
  server.all('*', (req, res) => {
    return handle(req, res)
  })

  const httpServer = createServer(server)

  // Initialize WebSocket server
  const { initWebSocket } = require('./src/lib/websocket')
  initWebSocket(httpServer)

  const port = process.env.PORT || 3000

  httpServer.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
