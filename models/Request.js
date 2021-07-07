const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  subjects: [String],
});

module.exports = mongoose.model("Request", RequestSchema);
