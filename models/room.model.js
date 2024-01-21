const baseModel = require('./base.model')
const message = require('./message.model')

const room = baseModel({
  roomId: {
    type: String,
    required: true,
  },
  lastMessage: Object
})

module.exports = room