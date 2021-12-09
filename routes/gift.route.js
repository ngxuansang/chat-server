const express = require('express')
const live_streaming_gifts = require('../models/live_streaming_gifts')
const router = express.Router()

router.get('/all', async (req, res) => {
  let gifts = await live_streaming_gifts.find({})
  res.status(200).json(gifts)
})

module.exports = router