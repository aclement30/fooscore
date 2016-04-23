var Match = require('../../server/models/match'),
    Player = require('../../server/models/player'),
    PlayerScore = require('../../server/models/playerScore'),
    moment = require('moment'),
    extend = require('extend');

describe("PlayerScore", function() {

    var match = new Match();
    var player = new Player({alias: 'P1', name: 'P1'});

    var defaultData = {
        matchId: match._id,
        date: moment(new Date()).subtract(7, 'days').toDate(),
        player: player._id,
        points: 10,
        win: true,
        solo: true
    };

    it("requires match ID", function () {
        var scoreData = extend(true, {}, defaultData);
        delete scoreData.matchId;

        var playerScore = new PlayerScore(scoreData);
        var error = playerScore.validateSync();

        expect(error.errors['matchId'].kind).toBe('required');
    });

    it("requires date", function () {
        var scoreData = extend(true, {}, defaultData);
        delete scoreData.date;

        var playerScore = new PlayerScore(scoreData);
        var error = playerScore.validateSync();

        expect(error.errors['date'].kind).toBe('required');
    });

    it("validates date type", function () {
        var scoreData = extend(true, {}, defaultData);
        scoreData.date = 'test';

        var playerScore = new PlayerScore(scoreData);
        var error = playerScore.validateSync();

        expect(error.errors['date'].kind).toBe('Date');
    });

    it("requires player", function () {
        var scoreData = extend(true, {}, defaultData);
        delete scoreData.player;

        var playerScore = new PlayerScore(scoreData);
        var error = playerScore.validateSync();

        expect(error.errors['player'].kind).toBe('required');
    });

    it("requires points", function () {
        var scoreData = extend(true, {}, defaultData);
        delete scoreData.points;

        var playerScore = new PlayerScore(scoreData);
        var error = playerScore.validateSync();

        expect(error.errors['points'].kind).toBe('required');
    });

    it("requires win", function () {
        var scoreData = extend(true, {}, defaultData);
        delete scoreData.win;

        var playerScore = new PlayerScore(scoreData);
        var error = playerScore.validateSync();

        expect(error.errors['win'].kind).toBe('required');
    });

    it("requires solo", function () {
        var scoreData = extend(true, {}, defaultData);
        delete scoreData.solo;

        var playerScore = new PlayerScore(scoreData);
        var error = playerScore.validateSync();

        expect(error.errors['solo'].kind).toBe('required');
    });

    it("data is valid", function () {
        var playerScore = new PlayerScore(defaultData);

        var error = playerScore.validateSync();

        expect(error).toEqual(undefined);
    });

    it("create from match", function () {
        var match = new Match({
            date: moment(new Date()).subtract(7, 'days').toDate(),
            team1: {
                players: [
                    new Player({alias: 'P1', name: 'P1'})._id,
                    new Player({alias: 'P2', name: 'P2'})._id
                ],
                points: 5
            },
            team2: {
                players: [
                    new Player({alias: 'P3', name: 'P3'})._id,
                    new Player({alias: 'P4', name: 'P4'})._id
                ],
                points: 10
            },
            balls: 4,
            comments: 'test-comments'
        });

        var playerScores = PlayerScore.createFromMatch(match);

        expect(playerScores.length).toBe(4);
        expect(playerScores[0].player).toEqual(match.team1.players[0]);
        expect(playerScores[1].player).toEqual(match.team1.players[1]);
        expect(playerScores[2].player).toEqual(match.team2.players[0]);
        expect(playerScores[3].player).toEqual(match.team2.players[1]);

        expect(playerScores[0].points).toEqual(match.team1.points);
        expect(playerScores[2].points).toEqual(match.team2.points);

        expect(playerScores[0].date).toEqual(match.date);
        expect(playerScores[0].win).toBeFalsy();
        expect(playerScores[0].solo).toBeFalsy();
        expect(playerScores[0].matchId).toEqual(match._id);
    });
});