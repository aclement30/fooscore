var moment = require('moment'),
    async = require('async'),
    PlayerScore = require('../models/playerScore'),
    statsCalculator = require("../services/statsCalculator")(PlayerScore);

function init(app) {
    app.get('/api/winningPercentages', function (req, res) {
        var startDate = moment(req.query.startDate),
            endDate = moment(req.query.endDate);

        async.parallel({
            solo: function(callback){
                statsCalculator.getWinningPercentagesForPeriod(startDate, endDate, true, function(error, percentages){
                    callback(error, percentages);
                })
            },
            duo: function(callback){
                statsCalculator.getWinningPercentagesForPeriod(startDate, endDate, false, function(error, percentages){
                    callback(error, percentages);
                });
            }
        }, function(error, winningPercentages) {
            if (!error) {
                res.send(winningPercentages);
            }
        });
    });
}

module.exports.init = init;