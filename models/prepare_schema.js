const mongoose = require("mongoose")
const prepare_schema = model_schema => new mongoose.Schema(model_schema, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})
module.exports = prepare_schema