const mongoose = require("mongoose")
const message = require('./message.model')
const room = require('./room.model')

module.exports = {
  messageModel: mongoose.model("messages", message),
  roomModel: mongoose.model("rooms", room)
}