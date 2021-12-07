const mongoose = require("mongoose")
const prepare_schema = require('./prepare_schema')


const message_schema = prepare_schema({
  user_id: {
    type: String,
    require: true,
  },
  user_name: {
    type: String,
    require: true,
  },
  message: {
    type: String,
    require: true,
  }
})

const live_streaming_chanels_schema = prepare_schema({
  chanel_id: {
    type: String,
    required: true,
  },
  messages: [message_schema]
})

const live_streaming_chanels = mongoose.model("live_streaming_chanels", live_streaming_chanels_schema)
module.exports = live_streaming_chanels