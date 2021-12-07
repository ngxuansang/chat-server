const express = require('express')
const live_streaming_chanels = require('../models/live_streaming_chanels')
const router = express.Router()
const moment = require('moment')

router.get('/:chanel_id', async (req, res) => {
  const startOfDate = moment.utc().startOf('day')
  const endOfDate = moment.utc().endOf('day')

  let chanel = await live_streaming_chanels.aggregate([
    {
      $match: {
        "chanel_id": req.params.chanel_id
      }
    },
    {
      $addFields: {
        "messages": {
          $filter: { // We override the existing field!
            input: "$messages",
            as: "message",
            cond: {
              "$and": [
                {
                  "$gte": ["$$message.updatedAt", startOfDate.toDate()]
                },
                {
                  "$lte": ["$$message.updatedAt", endOfDate.toDate()]
                }
              ]
            }
          }
        }
      }
    }
  ])

  res.status(200).json(chanel[0])
})

module.exports = router