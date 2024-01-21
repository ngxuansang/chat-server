const baseModel = require('./base.model')

const message = baseModel({
  userId: {
    type: String,
    require: true,
  },
  userName: {
    type: String,
    require: true,
  },
  message: {
    type: String,
    require: true,
  }
})

module.exports = message
