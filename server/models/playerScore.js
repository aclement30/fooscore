var mongoose = require('mongoose'),
    idValidator = require('mongoose-id-validator');

var schema = new mongoose.Schema({
    id: String,
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true
    },
    date: {             // Match date
        type: Date,
        required: true
    },
    player: {           // Player ID
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    points: {           // Scored points for team
        type: Number,
        required: true
    },
    win: {              // Won match
        type: Boolean,
        required: true
    },
    solo: {             // True for 1x1, false for 2x2
        type: Boolean,
        required: true
    },
    isDeleted: { type: Boolean, default: false }
});
schema.plugin(idValidator);

schema.static('createFromMatch', function(match) {

    var playerScores = [];

    var winningTeam = match.getWinningTeam();

    var createScoreForTeam = function(team) {
        team.players.forEach(function(player) {
            var scoreEntry = new PlayerScore({
                matchId: match._id,
                date: match.date,
                player: player,
                points: team.points,
                win: team == winningTeam,
                solo: team.players.length == 1
            });

            // Save player score to database
            scoreEntry.save();

            playerScores.push(scoreEntry);
        });
    };

    createScoreForTeam(match.team1);
    createScoreForTeam(match.team2);

    return playerScores;
});

module.exports = PlayerScore = mongoose.model('PlayerScore', schema);