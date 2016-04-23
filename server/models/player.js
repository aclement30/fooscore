var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    id: String,
    alias: {
        type: String,
        index: { unique: true },
        required: true
    },
    name: {
        type: String,
        required: true
    },
    userId: mongoose.Schema.Types.ObjectId,
    isDeleted: { type: Boolean, default: false }
});

module.exports = Player = mongoose.model('Player', schema);