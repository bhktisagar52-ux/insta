const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const path = require('path')
const fs = require('fs')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)

    // Serve static files from .next/static
    if (req.url.startsWith('/_next/static/')) {
      const filePath = path.join(__dirname, '.next', req.url)
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath)
        const contentType = ext === '.js' ? 'application/javascript' :
                           ext === '.css' ? 'text/css' :
                           'application/octet-stream'
        res.setHeader('Content-Type', contentType)
        fs.createReadStream(filePath).pipe(res)
        return
      }
    }

    // Handle all other requests with Next.js
    handle(req, res, parsedUrl)
  })

  // Initialize WebSocket server
  const { initWebSocket } = require('./src/lib/websocket')
  initWebSocket(httpServer)

  const port = process.env.PORT || 3000

  httpServer.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})

