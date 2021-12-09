const Queue = require("bull")
const { v4 } = require('uuid')
const giftQueue = new Queue("handle_grift_queue", process.env.REDIS_URL)

giftQueue.process(1, (job, done) => {
  job.data.queue_id = v4()
  done(null, job.data)
})

module.exports = giftQueue