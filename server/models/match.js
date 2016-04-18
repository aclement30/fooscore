var mongoose = require('mongoose');

var playerCountValidator = function (value) {
    if (!this.team1 || !this.team2) {
        return true;
    }

    var opponents;
    if (value == this.team2.players) {
        opponents = this.team1.players;
    } else {
        return true;    // Only validate 2nd team
    }

    return opponents.length == value.length;
};

var playerUniqueValidator = function (value) {
    if (!this.team1 || !this.team2) {
        return true;
    }

    // Check for duplicate player in same team
    if (value.length == 2) {
        if (value[0] == value[1] && value[0]) {
            return false;
        }
    }

    var opponents;
    if (value == this.team2.players) {
        opponents = this.team1.players;
    } else {
        return true;    // Only validate 2nd team
    }

    // Check for duplicate player in opponent team
    for(i=0; i<value.length; i++) {
        if (value[i] && opponents.indexOf(value[i]) >= 0) {
            return false;
        }
    }

    return true;
};

var teamSchema = new mongoose.Schema({
    players: {
        type: Array,
        required: true
    },
    points: {
        type: Number,
        required: true,
        min: [0, 'Invalid score']
    }
});

teamSchema.path('players').validate(playerCountValidator, 'Mismatching number of player in opponent team');
teamSchema.path('players').validate(playerUniqueValidator, 'Duplicate player in opponent team');

var schema = new mongoose.Schema({
    id: String,
    date: {
        type: Date,
        required: true
    },
    team1: {
        type: teamSchema,
        required: true
    },
    team2: {
        type: teamSchema,
        required: true
    },
    balls: {
        type: Number,
        required: true,
        min: [1, 'Invalid ball(s) quantity'],
        max: 10
    },
    comments: String,
    isDeleted: { type: Boolean, default: false }
});

schema.method('getWinningTeam', function () {
    if (this.team1.points > this.team1.points) {
        return this.team1;
    } else {
        return this.team2;
    }
});

// Return a Score model based upon the defined schema
module.exports = Match = mongoose.model('Match', schema);