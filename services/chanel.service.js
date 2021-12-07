const moment = require('moment')
const live_streaming_chanels = require('../models/live_streaming_chanels')
const _ = require('lodash')

const getMessagesByChanel = async (chanel_id, from, to) => {
  if (!from)
    from = moment.utc().startOf('day')

  if (!to)
    to = moment.utc().endOf('day')


  const chanels = await live_streaming_chanels.aggregate([
    {
      $match: {
        "chanel_id": chanel_id
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
                  "$gte": ["$$message.updatedAt", from.toDate()]
                },
                {
                  "$lte": ["$$message.updatedAt", to.toDate()]
                }
              ]
            }
          }
        }
      }
    }
  ])

  return _.get(chanels, '[0]')
}

module.exports = {
  getMessagesByChanel
}