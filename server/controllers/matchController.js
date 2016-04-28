var Match = require('../models/match'),
    PlayerScore = require('../models/playerScore'),
    errorHandler = require('../errorHandler'),
    requireAuth = require('../services/auth').check;

var convertDate = function(dateString) {
    // Extract date part using Regex
    var dateParts = dateString.match(/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/);

    // Create blank Date object from date YYYY-MM-DD (prevent timezone issues)
    return new Date(dateParts[0]);
};

function init(app) {
    app.get('/api/matches/:matchId', requireAuth, function (req, res) {
        var matchId = req.params.matchId;

        Match.findById(matchId).exec(function (err, object) {
            res.send(object);
        });
    });

    app.get('/api/matches', requireAuth, function (req, res) {
        var limit = Number(req.query.limit) || 100;
        if (limit < 1 || limit > 500) {
            limit = 100;
        }
        var page = Number(req.query.page) || 1;
        if (page < 1) {
            page = 1;
        }
        var offset = (page - 1) * limit;

        res.header('X-Page', page);

        Match.count({isDeleted: false}).exec(function(countError, count){
            res.header('X-Total-Count', count);

            Match.find({isDeleted: false}).skip(offset).limit(limit).sort({date: -1}).exec(function (err, objects) {
                var objectMap = {};

                objects.forEach(function (object) {
                    objectMap[object._id] = object;
                });

                res.send(objectMap);
            });
        });
    });

    app.post('/api/matches', requireAuth, function (req, res) {
        var data = req.body;

        // Construct a new Match object
        var matchData = {
            date: convertDate(data['date']),
            team1: data['team1'],
            team2: data['team2'],
            balls: parseInt(data['balls']),
            comments: data['comments']
        };

        // Create a new model instance with our object
        var match = new Match(matchData);

        match.save(function (error) {
            if (!error) {
                // Create player scores for current match
                PlayerScore.createFromMatch(match);

                res.status(201).send(match);
            } else {
                errorHandler.client(error, res);
            }
        });
    });

    app.put('/api/matches/:matchId', requireAuth, function (req, res) {
        var matchId = req.params.matchId;
        var data = req.body;

        if (!matchId || matchId == 'undefined') {
            errorHandler.client("Missing match ID", res);

            return;
        }

        // Erase existing player scores for this match
        PlayerScore.remove({'matchId': matchId}, function (err) {
            if (err) {
                errorHandler.server(err, res);
            }
        });

        Match.findById(matchId, function (err, match) {
            if (err) {
                errorHandler.client("Match not found (" + matchId + ')', res);

                return;
            }

            match.date = convertDate(data['date']);
            match.team1 = data['team1'];
            match.team2 = data['team2'];
            match.balls = parseInt(data['balls']);
            match.comments = data['comments'];

            match.save(function (error) {
                if (!error) {
                    // Create player scores for current match
                    PlayerScore.createFromMatch(match);

                    res.send(match);
                } else {
                    errorHandler.client(error, res);
                }
            });
        });
    });

    app.delete('/api/matches/:matchId', requireAuth, function (req, res) {
        var matchId = req.params.matchId;

        Match.update({_id: matchId}, {$set: {isDeleted: true}}, function (err) {
            if (!err) {
                res.sendStatus(200);
            }
        });
    });
}

module.exports.init = init;