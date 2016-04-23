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
    emailDomains: [{     // List of approved email domains for this group
        type: String,
        required: true
    }],
    isDeleted: { type: Boolean, default: false }
});

module.exports = Group = mongoose.model('Group', schema);