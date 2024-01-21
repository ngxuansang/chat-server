const mongoose = require("mongoose")

const baseModel = schema => new mongoose.Schema(schema, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
})

module.exports = baseModel