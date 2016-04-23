var async = require('async'),
    slug = require('slug'),
    fs = require('fs'),
    parse = require('csv-parse'),
    mongoose = require('mongoose'),
    config = require('./config/server'),
    PlayerScore = require('./server/models/playerScore'),
    Match = require('./server/models/match'),
    Player = require('./server/models/player');

// -------------------------------------------------------------------------
// DB SETUP
// -------------------------------------------------------------------------

// Connect to Mongo database
mongoose.connect(config.db);

// -------------------------------------------------------------------------
// PLAYERS
// -------------------------------------------------------------------------

var players = {};

var getPlayerAlias = function(name) {
    return slug(name).toLowerCase();
};

var getPlayerId = function(name) {
    var alias = getPlayerAlias(name);

    if (players[alias]) {
        return players[alias];
    } else {
        var newPlayer = Player({alias: alias, name: name});
        newPlayer.save();

        players[alias] = newPlayer._id;

        return newPlayer._id;
    }
};

// -------------------------------------------------------------------------
// CSV PARSER
// -------------------------------------------------------------------------

var parser = parse({delimiter: ','}, function(err, rows){
    var rowIndex = 0;

    var currentDate;

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];

        if (rowIndex > 0 && row[1] && row[3] && row[4]) {
            if (row[0]) {
                currentDate = row[0];
            }

            var team1 = {
                players: [getPlayerId(row[1])],
                points: parseInt(row[3])
            };

            if (row[2]) {
                team1.players.push(getPlayerId(row[2]));
            }

            var team2 = {
                players: [getPlayerId(row[5])],
                points: parseInt(row[4])
            };

            if (row[6]) {
                team2.players.push(getPlayerId(row[6]));
            }

            var balls;
            if (row[7] == '1x1') {
                balls = 1;
            } else if (row[7] == '4x1') {
                balls = 4;
            }

            var comments = null;
            if (row[8]) {
                comments = row[8];
            }

            var dateParts = currentDate.split('/');
            var date = new Date(dateParts[2], dateParts[1]-1, dateParts[0]);

            var newMatch = {
                date: date,
                team1: team1,
                team2: team2,
                balls: balls,
                comments: comments
            };

            // Create a new model instance with our object
            var matchEntry = new Match(newMatch);

            // Save match to database
            matchEntry.save(function(err, match) {
                if (!err) {
                    console.log(match);

                    PlayerScore.createFromMatch(match);
                } else {
                    console.log('Import error: ', err);
                }
            });
        }

        rowIndex++;
    }
});

// -------------------------------------------------------------------------

async.series([
    // Retrieve list of players
    function(callback){
        Player.find({isDeleted: false}).exec(function (err, objects) {
            objects.forEach(function (object) {
                players[object.alias] = object._id;
            });

            callback(err, players);
        });
    },
    // Clear saved player scores
    function(callback){
        PlayerScore.find({}).remove().exec(callback);
    },
    // Clear saved matches
    function(callback){
        Match.find({}).remove().exec(callback);
    }
], function(error, data) {
    if (!error) {
        var readStream = fs.createReadStream(__dirname+'/import-data/scores.csv');

        // This will wait until we know the readable stream is actually valid before piping
        readStream.on('open', function () {
            // This just pipes the read stream to the response object (which goes to the client)
            readStream.pipe(parser);
        });
    }
});