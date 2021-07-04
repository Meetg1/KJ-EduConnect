const mongoose = require('mongoose')

const ReplySchema = new mongoose.Schema({
    reply: {
        type: String,
        required: true
    },
    author_reply: {    
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User'                 
    }
}, {
    // if timestamps are set to true, mongoose assigns createdAt and updatedAt fields to your schema, the type assigned is Date.
    timestamps: true
});


module.exports = mongoose.model("Reply", ReplySchema);