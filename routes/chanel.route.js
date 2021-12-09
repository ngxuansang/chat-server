const express = require('express')
const live_streaming_chanels = require('../models/live_streaming_chanels')
const router = express.Router()
const moment = require('moment')
const chanelService = require('../services/chanel.service')


router.get('/:chanel_id', async (req, res) => {
  const startOfDate = moment.utc().startOf('day')
  const endOfDate = moment.utc().endOf('day')

  chanel = await chanelService.getMessagesByChanel(chanel_id, startOfDate, endOfDate)
  res.status(200).json(chanel)
})

module.exports = router