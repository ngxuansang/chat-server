'use strict';
require('dotenv').config()
const express = require('express')
const socketIO = require("socket.io")
const cors = require('cors')
const logger = require('morgan')
const _ = require('lodash')
const mongoose = require('mongoose')
const redisAdapter = require('@socket.io/redis-adapter')
const { createClient } = require("redis")
const live_streaming_chanels = require('./models/live_streaming_chanels')
const PORT = process.env.PORT || 5000;
const INDEX = '/index.html';

const chanelService = require('./services/chanel.service')
const giftQueue = require("./queues/gift.queue")

const server = express()
  .use(cors())
  .use(logger('dev'))
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

mongoose.connect(process.env.MONGO_DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => createClient({ url: process.env.REDIS_URL }))
  .then(pubClient => ({ pubClient, subClient: pubClient.duplicate() }))
  .then(({ pubClient, subClient }) => {
    const io = socketIO(server)
    io.adapter(redisAdapter(pubClient, subClient))
    console.log("Connected MongoDB successfully")
    console.log("Connected Redis successfully")

    io.on('connection', (socket) => {
      console.log('Client connected', socket.id)

      socket.on('send_gift', async payload => {
        await giftQueue.add(payload)
      })

      socket.on('join_room', async ({ user_name, user_id, chanel_id }) => {
        const clients = await io.in(chanel_id).fetchSockets()
        console.log('join_room', { user_name, user_id, chanel_id })

        let chanel = await live_streaming_chanels.findOne({ chanel_id })
        if (!chanel)
          await live_streaming_chanels.create({ chanel_id })

        chanel = await chanelService.getMessagesByChanel(chanel_id)
        await socket.join(chanel_id)
        io.to(chanel_id).emit('subscribe.channel_concurrent', { concurrent: clients.length, chanel_id })
        io.to(socket.id).emit('subscribe.channel_messages', chanel)
        io.to(chanel_id).emit('subscribe.new_message', {
          chanel_id,
          user_name,
          user_id,
          message: `${user_name} joined`,
          is_system: true,
        })
      })

      socket.on('send_message', async (payload) => {
        payload.date = new Date()
        const { user_name, user_id, message, chanel_id, user_level, live_streaming_id } = payload
        const message_data = {
          chanel_id,
          user_name,
          user_id,
          message,
          is_system: false,
          user_level,
          live_streaming_id
        }

        io.in(chanel_id).emit("subscribe.new_message", payload)
        io.in(chanel_id).emit("sub.chat", payload)
        await live_streaming_chanels.updateOne({ chanel_id }, {
          "$push": {
            messages: message_data
          }
        })
      })

      socket.on('leave_room', async ({ user_name, user_id, chanel_id }) => {
        console.log('leave_room', { user_name, user_id, chanel_id })
        const clients = await io.in(chanel_id).fetchSockets()
        socket.leave(chanel_id)

        io.to(chanel_id).emit("subscribe.new_message", {
          chanel_id,
          user_name,
          user_id,
          message: `${user_name} has left the live`,
          is_system: true
        })
        io.to(chanel_id).emit('subscribe.channel_concurrent', { concurrent: clients.length, chanel_id })
      })

      socket.on('disconnecting', async reason => {
        for (const chanel_id of socket.rooms) {
          const clients = await io.in(chanel_id).fetchSockets()
          io.to(chanel_id).emit('subscribe.chanel_concurrent', {
            concurrent: clients.length,
            chanel_id
          })
        }
      })
    })

    io.on('connect', (socket) => {
      console.log('connect', {})
    })

    giftQueue.on("completed", (job, result) => {
      console.log(`Job with id ${job.id} has been completed.`, { result });
      io.to(result.chanel_id).emit('subscribe.receive_gift', result)
      io.to(result.chanel_id).emit('sub.gift', result)
    })
  })
  .catch(err => console.error("connection error: ", { err }))
