const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    documentId: String,
    message : {
        type: String,
    }
});

module.exports = mongoose.model("Notification", NotificationSchema);