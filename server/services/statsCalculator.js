var moment = require('moment'),
    async = require('async'),
    sortKeys = require('sort-keys');

module.exports = function(PlayerScore) {
    var public = {
        /**
         * Combine multiple scores for a single day into an object
         * @param {Date} date
         * @param {Boolean} soloPlayer
         * @param {Function} callback
         */
        getCombinedScoresForDate: function(date, soloPlayer, callback) {
            var today = moment(date).startOf('day'),
                tomorrow = moment(today).add(1, 'days');

            PlayerScore.find({
                solo: soloPlayer,
                date: {"$gte": today, "$lt": tomorrow},
                isDeleted: false
            }).exec(function(err, scores){
                if (!err) {
                    var dailyScore = {};

                    async.each(scores, function(playerScore, eachCallback) {
                        if (!dailyScore[playerScore.player]) {
                            dailyScore[playerScore.player] = {
                                played: 0,
                                won: 0
                            };
                        }

                        dailyScore[playerScore.player].played++;

                        if (playerScore.win) {
                            dailyScore[playerScore.player].won++;
                        }

                        eachCallback();
                    }, function(error){
                        callback(error, dailyScore);
                    });
                } else {
                    console.log(err);
                }
            });
        },

        /**
         * Calculate incremental winning percentages (won/played matches) for each day comprised in a daily scores list
         *
         * @param {Object} dailyScores
         * @param {Function} callback
         */
        calculateIncrementalWinningPercentages: function(dailyScores, callback) {
            var incrementalScores = {};

            // Make sure daily scores are ordered by date
            dailyScores = sortKeys(dailyScores);

            var tasks = [];

            // Loop through each daily scores to get incremental winning percentages
            async.forEachOf(dailyScores, function(dailyScore, date, forEachOfCallback) {
                // Create calculation task for each day
                tasks.push(function(taskCallback) {
                    var dayPercentages = {
                        date: moment(date).format('YYYY-MM-DD'),
                        percentages: []
                    };

                    // Loop through each player daily score
                    for (var player in dailyScore) {
                        if (dailyScore.hasOwnProperty(player)) {
                            var score = dailyScore[player];

                            if (!incrementalScores[player]) {
                                incrementalScores[player] = {
                                    played: 0,
                                    won: 0
                                };
                            }

                            // Add current daily score to incremented scores
                            incrementalScores[player].played += score.played;
                            incrementalScores[player].won += score.won;
                        }
                    }

                    // Loop through each player incremental score
                    for (var player in incrementalScores) {
                        if (incrementalScores.hasOwnProperty(player)) {
                            // Calculate daily winning percentage for player from incremented scores (including current score)
                            dayPercentages.percentages.push({
                                player: player,
                                winPercent: Math.round(incrementalScores[player].won / incrementalScores[player].played * 1000) / 1000,
                                played: incrementalScores[player].played
                            });
                        }
                    }

                    taskCallback(false, dayPercentages);
                });

                forEachOfCallback();
            }, function(error){
                // Execute tasks in sequential order
                async.series(tasks, function(error, dailyPercentages){
                    callback(error, dailyPercentages);
                });
            });
        },

        getWinningPercentagesForPeriod: function(startDate, endDate, soloPlayer, callback) {
            var currentDate = startDate;

            var tasks = {};

            while (currentDate <= endDate) {
                tasks[moment(currentDate).format('YYYY-MM-DD')] = (function(date) {
                    return function (taskCallback) {
                        public.getCombinedScoresForDate(date, soloPlayer, function(error, dailyScore){
                            taskCallback(false, dailyScore);
                        });
                    }
                })(currentDate);

                // Increment current date
                currentDate = moment(currentDate).add(1, 'day').toDate();
            }

            async.waterfall([
                function(firstCallback) {
                    async.parallel(tasks, function(error, dailyScores){
                        firstCallback(error, dailyScores);
                    });
                },
                function(dailyScores, secondCallback) {
                    public.calculateIncrementalWinningPercentages(dailyScores, function(error, dailyPercentages){
                        secondCallback(error, dailyPercentages);
                    });
                }
            ], callback);
        }
    };

    return public;
};