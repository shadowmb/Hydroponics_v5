const express = require('express')
const app = express()
const PORT = 5000

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Minimal server working' })
})

const server = app.listen(PORT, () => {
  console.log(`✅ Minimal server started on port ${PORT}`)
})

process.on('SIGINT', () => {
  console.log('🔒 Server shutting down...')
  server.close()
  process.exit(0)
})