const mongoose = require("mongoose")
const prepare_schema = require('./prepare_schema')

const live_streaming_gifts_schema = prepare_schema({
  name: {
    type: String,
    required: true,
  },
  url: String,
  type: {
    type: String,
    required: true,
  },
  maximunPerUse: {
    type: Number,
    required: true,
  },
  resource: Object
})

const live_streaming_gifts = mongoose.model("live_streaming_gifts", live_streaming_gifts_schema)
module.exports = live_streaming_gifts