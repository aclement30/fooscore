var fs = require('fs'),
    parse = require('csv-parse'),
    mongoose = require('mongoose'),
    PlayerScore = require('./server/models/playerScore'),
    Match = require('./server/models/match');

// Connect to Mongo database
mongoose.connect('mongodb://localhost/babyfoot-scores');

PlayerScore.find({}).remove().exec();
Match.find({}).remove().exec();

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
                players: [row[1]],
                points: parseInt(row[3])
            };

            if (row[2]) {
                team1.players.push(row[2]);
            }

            var team2 = {
                players: [row[5]],
                points: parseInt(row[4])
            };

            if (row[6]) {
                team2.players.push(row[6]);
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

fs.createReadStream(__dirname+'/import-data/scores.csv').pipe(parser);