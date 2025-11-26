const express = require('express')
const router = express.Router()

router.post('/system-state', async (req, res) => {
  const stateDump = req.body

  console.log('🛠️ Production debug state received:', stateDump)

  // TODO: IMPLEMENT_LATER - запиши го във файл, DB, лог или изпрати email
  res.status(200).json({ ok: true, message: 'State received' })
})

module.exports = router
