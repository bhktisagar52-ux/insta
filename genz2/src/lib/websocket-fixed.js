const { Server: HTTPServer } = require('http')
const { Server } = require('socket.io')

let io

function initWebSocket(httpServer) {
  io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)

    // Join user's room for private messaging
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`)
      console.log(`User ${userId} joined their room`)
    })

    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation-${conversationId}`)
      console.log(`User joined conversation ${conversationId}`)
    })

    // Leave conversation room
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation-${conversationId}`)
      console.log(`User left conversation ${conversationId}`)
    })

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`)
    })

    socket.on('error', (error) => {
      console.error(`Socket error (${socket.id}):`, error)
    })
  })

  return io
}

function getIO() {
  if (!io) {
    throw new Error('WebSocket server not initialized')
  }
  return io
}

// Emit new message to conversation participants
function emitNewMessage(conversationId, message) {
  if (io) {
    io.to(`conversation-${conversationId}`).emit('new-message', message)
  }
}

// Emit message reaction update
function emitMessageReaction(conversationId, messageId, reaction) {
  if (io) {
    io.to(`conversation-${conversationId}`).emit('message-reaction', { messageId, reaction })
  }
}

module.exports = { initWebSocket, getIO, emitNewMessage, emitMessageReaction }
