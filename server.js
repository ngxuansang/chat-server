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
const { roomModel, messageModel } = require('./models')
const PORT = process.env.PORT || 5000;
const INDEX = '/index.html';

const roomService = require('./services/room.service')

const server = express()
  .use(cors())
  .use(logger('dev'))
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

mongoose.connect(process.env.MONGO_DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => createClient({ host: process.env.REDIS_HOST, auth_pass: process.env.REDIS_PASS, no_ready_check: true }))
  .then(pubClient => ({ pubClient, subClient: pubClient.duplicate() }))
  .then(({ pubClient, subClient }) => {
    const io = socketIO(server, {
      cors: {
        origin: 'http://localhost:3000',
        credentials: true
      }
    })
    io.adapter(redisAdapter(pubClient, subClient))

    pubClient.on("error", (err) => {
      console.log(err.message);
    });

    subClient.on("error", (err) => {
      console.log(err.message);
    });

    console.log("Connected MongoDB successfully")
    console.log("Connected Redis successfully")

    io.on('connection', (socket) => {
      console.log('Client connected', socket.id)

      socket.on('pub.join', async ({ userName, userId, roomId }) => {
        console.log('pub.join', { userName, userId, roomId })

        await socket.join(roomId)

        const clients = await io.in(roomId).fetchSockets()
        let room = await roomModel.findOne({ roomId })

        if (!room)
          room = await roomModel.create({ roomId })

        io.to(roomId).emit('sub.clients', { connections: clients.length, roomId })

        io.to(socket.id).emit('sub.messages', await roomService.getMessagesByRoomId(roomId))

        io.to(roomId).emit('sub.chat', {
          roomId,
          userName,
          userId,
          message: `${userName} joined`,
          isSystem: true,
        })
      })

      socket.on('pub.send', async (payload) => {
        payload.date = new Date()
        const { userName, userId, message, roomId, userLevel } = payload
        const messageData = {
          roomId,
          userName,
          userId,
          message,
          isSystem: false,
          userLevel
        }

        io.in(roomId).emit("sub.chat", payload)

        await roomModel.updateOne({ roomId }, {
          "$set": {
            lastMessage: await messageModel.create(messageData)
          }
        })
      })

      socket.on('pub.leave', async ({ userName, userId, roomId }) => {
        console.log('pub.leave', { userName, userId, roomId })
        const clients = await io.in(roomId).fetchSockets()
        socket.leave(roomId)

        io.to(roomId).emit("sub.chat", {
          roomId,
          userName,
          userId,
          message: `${userName} has left the live`,
          isSystem: true
        })

        io.to(roomId).emit('sub.clients', { connections: clients.length, roomId })
      })

      socket.on('disconnecting', async reason => {
        for (const roomId of socket.rooms) {
          const clients = await io.in(roomId).fetchSockets()

          io.to(roomId).emit('sub.clients', {
            connections: clients.length,
            roomId
          })
        }
      })
    })

    io.on('connect', (socket) => {
      console.log('connect', {})
    })
  })
  .catch(err => console.error("connection error: ", { err }))
