const mongoose = require("mongoose")
const prepare_schema = model_schema => new mongoose.Schema(model_schema, { timestamps: true })
module.exports = prepare_schema