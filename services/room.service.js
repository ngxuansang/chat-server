const moment = require('moment')
const { messageModel } = require('../models')
const _ = require('lodash')

const getMessagesByRoomId = async (roomId, from, to) => {
  if (!from)
    from = moment.utc().startOf('day')

  if (!to)
    to = moment.utc().endOf('day')

  // const room = await roomModel.aggregate([
  //   {
  //     $match: {
  //       "roomId": roomId
  //     }
  //   },
  //   {
  //     $addFields: {
  //       "messages": {
  //         $filter: { // We override the existing field!
  //           input: "$messages",
  //           as: "message",
  //           cond: {
  //             "$and": [
  //               {
  //                 "$gte": ["$$message.updatedAt", from.toDate()]
  //               },
  //               {
  //                 "$lte": ["$$message.updatedAt", to.toDate()]
  //               }
  //             ]
  //           }
  //         }
  //       }
  //     }
  //   }
  // ])

  return await messageModel.find({ roomId })
}

module.exports = {
  getMessagesByRoomId
}