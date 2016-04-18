var Match = require('../../server/models/match'),
    moment = require('moment'),
    extend = require('extend');

describe("Match", function() {

    var defaultData = {
        date: moment(new Date()).subtract(7, 'days').toDate(),
        team1: {
            players: [
                'P1',
                'P2'
            ],
            points: 5
        },
        team2: {
            players: [
                'P3',
                'P4'
            ],
            points: 10
        },
        balls: 4,
        comments: 'test-comments'
    };

    it("requires date", function () {
        var matchData = extend(true, {}, defaultData);
        delete matchData.date;

        var match = new Match(matchData);
        var error = match.validateSync();

        expect(error.errors['date'].kind).toBe('required');
    });

    it("validates date type", function () {
        var matchData = extend(true, {}, defaultData);
        matchData.date = 'test';

        var match = new Match(matchData);
        var error = match.validateSync();

        expect(error.errors['date'].kind).toBe('Date');
    });

    it("requires 2 teams", function () {
        var matchData = extend(true, {}, defaultData);
        delete matchData.team1;
        delete matchData.team2;

        var match = new Match(matchData);
        var error = match.validateSync();

        expect(error.errors['team1'].kind).toBe('required');
        expect(error.errors['team2'].kind).toBe('required');
    });

    it("validates matching number of players in each team", function () {
        var matchData = extend(true, {}, defaultData);
        matchData.team1.players.splice(0, 1);

        var match = new Match(matchData);
        var error = match.validateSync();

        expect(error.errors['team2.players'].message).toBe('Mismatching number of player in opponent team');
    });

    it("validates unique players in same team", function () {
        var matchData = extend(true, {}, defaultData);
        matchData.team1.players[0] = matchData.team1.players[1];

        var match = new Match(matchData);
        var error = match.validateSync();

        expect(error.errors['team1.players'].message).toBe('Duplicate player in opponent team');
    });

    it("validates unique players in match", function () {
        var matchData = extend(true, {}, defaultData);
        matchData.team1.players[0] = matchData.team2.players[1];

        var match = new Match(matchData);
        var error = match.validateSync();

        expect(error.errors['team2.players'].message).toBe('Duplicate player in opponent team');
    });

    it("requires team points", function () {
        var matchData = extend(true, {}, defaultData);
        delete matchData.team1.points;
        delete matchData.team2.points;

        var match = new Match(matchData);
        var error = match.validateSync();

        expect(error.errors['team1.points'].kind).toBe('required');
        expect(error.errors['team2.points'].kind).toBe('required');
    });

    it("requires valid team points", function () {
        var matchData = extend(true, {}, defaultData);
        matchData.team1.points = -1;
        matchData.team2.points = -1;

        var match = new Match(matchData);
        var error = match.validateSync();

        expect(error.errors['team1.points'].message).toBe('Invalid score');
        expect(error.errors['team2.points'].message).toBe('Invalid score');
    });

    it("requires number of balls", function () {
        var matchData = extend(true, {}, defaultData);
        delete matchData.balls;

        var match = new Match(matchData);
        var error = match.validateSync();

        expect(error.errors['balls'].kind).toBe('required');
    });

    it("data is valid", function () {
        var match = new Match(defaultData);

        var error = match.validateSync();

        expect(error).toEqual(undefined);
    });

    it("returns winning team", function () {
        var match = new Match(defaultData);

        var winningTeam = match.getWinningTeam();

        expect(winningTeam.players).toEqual(defaultData.team2.players);
    });
});