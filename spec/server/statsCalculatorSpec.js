var moment = require('moment'),
    mongoose = require('mongoose'),
    config = require('../../server/config')['test'],
    PlayerScore = require('../../server/models/playerScore'),
    statsCalculator = require("../../server/services/statsCalculator")(PlayerScore);

mongoose.connect(config.db);

describe("StatsCalculator", function() {

    var getDayInterval = function (date) {
        var today = moment(date).startOf('day'),
            tomorrow = moment(today).add(1, 'days');

        return {"$gte": today, "$lt": tomorrow};
    };

    it("returns solo match combined scores for date", function(done) {
        var scoresPromise = {
            exec: function(callback) {
                callback(false, {
                    // Solo player match scores
                    scoreId1: {
                        _id: 'scoreId1',
                        matchId: 'matchId1',
                        date: new Date(),
                        player: 'Alex',
                        points: 10,
                        win: true,
                        solo: true,
                        isDeleted: false
                    },
                    scoreId2: {
                        _id: 'scoreId2',
                        matchId: 'matchId1',
                        date: new Date(),
                        player: 'Louis',
                        points: 8,
                        win: false,
                        solo: true,
                        isDeleted: false
                    }
                });
            }
        };

        var date = new Date();

        spyOn(PlayerScore, 'find').and.returnValue(scoresPromise);

        statsCalculator.getCombinedScoresForDate(date, true, function(error, dailyScore){
            expect(dailyScore).toEqual({
                'Alex': {
                    played: 1,
                    won: 1
                },
                'Louis': {
                    played: 1,
                    won: 0
                }
            });

            expect(PlayerScore.find.calls.argsFor(0)[0].date).toEqual(getDayInterval(date));
            expect(PlayerScore.find.calls.argsFor(0)[0].solo).toBeTruthy();

            done();
        });
    });

    it("returns 2x2 match combined scores for date", function(done) {
        var scoresPromise = {
            exec: function(callback) {
                callback(false, {
                    // 2 players match scores
                    scoreId3: {
                        _id: 'scoreId3',
                        matchId: 'matchId2',
                        date: new Date(),
                        player: 'Alex',
                        points: 11,
                        win: true,
                        solo: false,
                        isDeleted: false
                    },
                    scoreId4: {
                        _id: 'scoreId4',
                        matchId: 'matchId2',
                        date: new Date(),
                        player: 'Louis',
                        points: 11,
                        win: true,
                        solo: false,
                        isDeleted: false
                    },
                    scoreId5: {
                        _id: 'scoreId5',
                        matchId: 'matchId2',
                        date: new Date(),
                        player: 'Marc',
                        points: 6,
                        win: false,
                        solo: false,
                        isDeleted: false
                    },
                    scoreId6: {
                        _id: 'scoreId6',
                        matchId: 'matchId2',
                        date: new Date(),
                        player: 'Julien',
                        points: 6,
                        win: false,
                        solo: false,
                        isDeleted: false
                    }
                });
            }
        };

        var date = new Date();

        spyOn(PlayerScore, 'find').and.returnValue(scoresPromise);

        statsCalculator.getCombinedScoresForDate(date, false, function(error, dailyScore){
            expect(dailyScore).toEqual({
                'Alex': {
                    played: 1,
                    won: 1
                },
                'Louis': {
                    played: 1,
                    won: 1
                },
                'Marc': {
                    played: 1,
                    won: 0
                },
                'Julien': {
                    played: 1,
                    won: 0
                }
            });

            expect(PlayerScore.find.calls.argsFor(0)[0].date).toEqual(getDayInterval(date));
            expect(PlayerScore.find.calls.argsFor(0)[0].solo).toBeFalsy();

            done();
        });
    });

    it("returns daily incremented winning percentages", function(done) {
        var dailyScores = {
            '2016-04-01': {
                'Alex': {
                    played: 1,
                    won: 1
                },
                'Louis': {
                    played: 1,
                    won: 0
                }
            },
            '2016-04-03': {
                'Alex': {
                    played: 2,
                    won: 0
                },
                'Louis': {
                    played: 2,
                    won: 2
                }
            },
            '2016-04-02': {
                'Alex': {
                    played: 1,
                    won: 0
                },
                'Louis': {
                    played: 1,
                    won: 1
                }
            },
            '2016-04-04': {
            }
        };

        statsCalculator.calculateIncrementalWinningPercentages(dailyScores, function(error, dailyPercentages){
            expect(dailyPercentages).toEqual([
                {date: '2016-04-01', percentages: [
                    {player: 'Alex', winPercent: 1, played: 1},
                    {player: 'Louis', winPercent: 0, played: 1}
                ]},
                {date: '2016-04-02', percentages: [
                    {player: 'Alex', winPercent: 0.5, played: 2},
                    {player: 'Louis', winPercent: 0.5, played: 2}
                ]},
                {date: '2016-04-03', percentages: [
                    {player: 'Alex', winPercent: 0.25, played: 4},
                    {player: 'Louis', winPercent: 0.75, played: 4}
                ]},
                {date: '2016-04-04', percentages: [     // Winning percentages should stay the same on the 4th day
                    {player: 'Alex', winPercent: 0.25, played: 4},
                    {player: 'Louis', winPercent: 0.75, played: 4}
                ]}
            ]);

            done();
        });
    });

    it("returns winning percentages for period", function(done) {
        var firstDay = moment('2016-04-03').startOf('week').toDate(),
            secondDay = moment(firstDay).add(1, 'day').toDate();

        var scorePromises = [
            {
                exec: function(callback) {
                    callback(false, {
                        // Solo player match scores
                        scoreId1: {
                            _id: 'scoreId1',
                            matchId: 'matchId1',
                            date: firstDay,
                            player: 'Alex',
                            points: 10,
                            win: true,
                            solo: true,
                            isDeleted: false
                        },
                        scoreId2: {
                            _id: 'scoreId2',
                            matchId: 'matchId1',
                            date: firstDay,
                            player: 'Louis',
                            points: 8,
                            win: false,
                            solo: true,
                            isDeleted: false
                        }
                    });
                }
            },
            {
                exec: function(callback) {
                    callback(false, {
                        // Solo player match scores
                        scoreId3: {
                            _id: 'scoreId3',
                            matchId: 'matchId2',
                            date: secondDay,
                            player: 'Alex',
                            points: 7,
                            win: false,
                            solo: true,
                            isDeleted: false
                        },
                        scoreId4: {
                            _id: 'scoreId4',
                            matchId: 'matchId2',
                            date: secondDay,
                            player: 'Louis',
                            points: 10,
                            win: true,
                            solo: true,
                            isDeleted: false
                        }
                    });
                }
            },
            {
                exec: function(callback) {
                    callback(false, {});
                }
            }
        ];

        var startDate = moment('2016-04-03').startOf('week').toDate(),
            endDate = moment(startDate).add(2, 'd');

        spyOn(PlayerScore, 'find').and.returnValues(
            scorePromises[0],
            scorePromises[1],
            scorePromises[2],
            scorePromises[3],
            scorePromises[4],
            scorePromises[5],
            scorePromises[6]
        );

        statsCalculator.getWinningPercentagesForPeriod(startDate, endDate, true, function(error, winningPercentages){
            expect(winningPercentages).toEqual([
                {date: '2016-04-03', percentages: [
                    {player: 'Alex', winPercent: 1, played: 1},
                    {player: 'Louis', winPercent: 0, played: 1}
                ]},
                {date: '2016-04-04', percentages: [
                    {player: 'Alex', winPercent: 0.5, played: 2},
                    {player: 'Louis', winPercent: 0.5, played: 2}
                ]},
                {date: '2016-04-05', percentages: [
                    {player: 'Alex', winPercent: 0.5, played: 2},
                    {player: 'Louis', winPercent: 0.5, played: 2}
                ]}
            ]);

            expect(PlayerScore.find.calls.argsFor(0)[0].date).toEqual(getDayInterval(startDate));
            expect(PlayerScore.find.calls.argsFor(0)[0].solo).toBeTruthy();

            done();
        });
    });
});

mongoose.disconnect();