'use strict';
require('dotenv').config()
const express = require('express')
const socketIO = require('socket.io')
const _ = require('lodash')
const chanelService = require('./services/chanel.service')
const mongoose = require('mongoose');
const live_streaming_chanels = require('./models/live_streaming_chanels')
const PORT = process.env.PORT || 5200;
const INDEX = '/index.html';
console.log(process.env.MONGO_DB_URL)


const chanel_route = require('./routes/chanel.route')

const server = express()
  .use('/chanel', chanel_route)
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

mongoose.connect(process.env.MONGO_DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {

  })
  .catch((error) => {
    console.log({ error })
  })
const io = socketIO(server)
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected MongoDB successfully")

  io.on('connection', (socket) => {
    console.log('Client connected', socket.id);
    socket.on('send_gift', data => {
      console.log({ data })
      socket.broadcast.emit('receive_gift', data)
      socket.emit('receive_gift', data)
    })

    socket.on('join_room', ({ user_name, user_id, chanel_id }) => {
      console.log('join_room', { user_name, user_id, chanel_id })
      socket.join(chanel_id, async (err) => {
        let chanel = await live_streaming_chanels.findOne({ chanel_id })
        if (!chanel)
          await live_streaming_chanels.create({ chanel_id })

        chanel = await chanelService.getMessagesByChanel(chanel_id)
        io.in(chanel_id).emit('subscribe.chanel_messages', chanel)
        console.log(io.sockets.adapter.rooms)
        err && console.log({ err })
      })

      io.in(chanel_id).emit('new_message', {
        chanel_id,
        user_name,
        user_id,
        message: `${user_name} joined`,
        is_system: true,
      })
    })

    socket.on('send_message', async ({ user_name, user_id, message, chanel_id }) => {
      const message_data = {
        chanel_id,
        user_name,
        user_id,
        message,
        is_system: false
      }

      io.in(chanel_id).emit("new_message", message_data)
      await live_streaming_chanels.updateOne({ chanel_id }, {
        "$push": {
          messages: message_data
        }
      })
    })

    socket.on('leave_room', ({ user_name, user_id, chanel_id }) => {
      console.log('leave_room', { user_name, user_id, chanel_id })
      socket.leave(chanel_id)
      io.in(chanel_id).emit("new_message", {
        chanel_id,
        user_name,
        user_id,
        message: `${user_name} leaved`,
        is_system: true
      })
    })

    socket.on('disconnect', (socket) => {

    })
  })

  io.on('connect', (socket) => {
    console.log('connect', {})
  });

})

const rooms = {}



