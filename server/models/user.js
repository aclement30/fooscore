var mongoose = require('mongoose');

var googleSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    }
});

var schema = new mongoose.Schema({
    id: String,
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'player'
    },
    google: googleSchema,
    isDeleted: { type: Boolean, default: false }
});

module.exports = User = mongoose.model('User', schema);