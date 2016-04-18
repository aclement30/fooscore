var Match = require('../models/match'),
    errorHandler = require('../errorHandler');

function init(app) {
    app.get('/api/matches/:matchId', function (req, res) {
        var matchId = req.params.matchId;

        Match.findById(matchId).exec(function (err, object) {
            res.send(object);
        });
    });

    app.get('/api/matches', function (req, res) {
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

    app.post('/api/matches', function (req, res) {
        var data = req.body;

        // Construct a new Match object
        var match = {
            date: data['date'],
            team1: data['team1'],
            team2: data['team2'],
            balls: parseInt(data['balls']),
            comments: data['comments']
        };

        // Create a new model instance with our object
        var matchEntry = new Match(match);

        matchEntry.save(function (error) {
            if (!error) {
                res.status(201).send(matchEntry);
            } else {
                errorHandler.client(error, res);
            }
        });
    });

    app.put('/api/matches/:matchId', function (req, res) {
        var matchId = req.params.matchId;
        var data = req.body;

        if (!matchId || matchId == 'undefined') {
            errorHandler.client("Missing match ID", res);

            return;
        }

        Match.findById(matchId, function (err, match) {
            if (err) {
                errorHandler.client("Match not found (" + matchId + ')', res);

                return;
            }

            match.date = data['date'];
            match.team1 = data['team1'];
            match.team2 = data['team2'];
            match.balls = parseInt(data['balls']);
            match.comments = data['comments'];

            match.save(function (error) {
                if (!error) {
                    res.send(match);
                } else {
                    errorHandler.client(error, res);
                }
            });
        });
    });

    app.delete('/api/matches/:matchId', function (req, res) {
        var matchId = req.params.matchId;

        Match.update({_id: matchId}, {$set: {isDeleted: true}}, function (err) {
            if (!err) {
                res.sendStatus(200);
            }
        });
    });
}

module.exports.init = init;