var request = require("request"),
    mongoose = require('mongoose'),
    config = require('../../server/config')['test'],
    moment = require('moment');

var baseUrl = "http://localhost:3000";

var firstMatchId,
    testMatchId;

describe("GET /api/matches", function() {
    it("returns status code 200", function (done) {
        request.get(baseUrl + '/api/matches', function (error, response, body) {
            expect(response.statusCode).toBe(200);

            done();
        });
    });

    it("returns a list of matches", function (done) {
        request.get(baseUrl + '/api/matches', function (error, response, body) {
            var matches = JSON.parse(body);
            var matchIds = Object.keys(matches);

            firstMatchId = matchIds[0];

            expect(matchIds.length).toBeGreaterThan(0);
            expect(matchIds.length).toBeLessThan(101);

            var match = matches[firstMatchId];
            expect(match._id).toBe(firstMatchId);
            expect(match.isDeleted).toBeFalsy();

            expect(response.headers['x-page']).toBeDefined();
            expect(response.headers['x-total-count']).toBeDefined();

            done();
        });
    });

    it("returns a 5 matches on 2nd page", function (done) {
        request.get(baseUrl + '/api/matches?limit=5&page=2', function (error, response, body) {
            var matches = JSON.parse(body);
            var matchIds = Object.keys(matches);

            expect(matchIds.length).toBe(5);
            expect(matchIds[0]).not.toBe(firstMatchId);
            expect(Number(response.headers['x-page'])).toBe(2);

            done();
        });
    });

    it("returns a specific match", function (done) {
        request.get(baseUrl + '/api/matches/' + firstMatchId, function (error, response, body) {
            var match = JSON.parse(body);

            expect(response.statusCode).toBe(200);

            expect(match._id).toBe(firstMatchId);
            expect(match.date).toBeDefined();
            expect(match.team1).toBeDefined();
            expect(match.team2).toBeDefined();

            done();
        });
    });
});

describe("POST /api/matches", function() {
    it("create a match", function(done) {
        var matchData = {
            date: new Date(),
            team1: {
                players: [
                    'P1',
                    'P2'
                ],
                points: 10
            },
            team2: {
                players: [
                    'P3',
                    'P4'
                ],
                points: 8
            },
            balls: 1,
            comments: 'test-comments-for-create'
        };

        request.post(baseUrl + '/api/matches', {form: matchData}, function(error, response, body) {
            var createdMatch = JSON.parse(body);

            expect(response.statusCode).toBe(201);

            if (response.statusCode == 201) {
                expect(createdMatch._id).toBeDefined();
                expect(moment(createdMatch.date).format('YYYY-MM-DD')).toEqual(moment(matchData.date).format('YYYY-MM-DD'));
                expect(createdMatch.team1.players).toEqual(matchData.team1.players);
                expect(createdMatch.team2.players).toEqual(matchData.team2.players);
                expect(Number(createdMatch.team1.points)).toEqual(matchData.team1.points);
                expect(Number(createdMatch.team2.points)).toEqual(matchData.team2.points);
                expect(createdMatch.balls).toEqual(matchData.balls);
                expect(createdMatch.comments).toEqual(matchData.comments);

                testMatchId = createdMatch._id;
            }

            done();
        });
    });
});

describe("PUT /api/matches", function() {
    it("update a match", function(done) {
        var matchData = {
            date: moment(new Date()).subtract(7, 'days').toDate(),
            team1: {
                players: [
                    'P4',
                    'P3'
                ],
                points: 5
            },
            team2: {
                players: [
                    'P2',
                    'P1'
                ],
                points: 6
            },
            balls: 4,
            comments: 'test-comments-for-update'
        };

        request.put(baseUrl + '/api/matches/' + testMatchId, {form: matchData}, function(error, response, body) {
            var updatedMatch = JSON.parse(body);

            expect(response.statusCode).toBe(200);

            if (response.statusCode == 200) {
                expect(updatedMatch._id).toEqual(testMatchId);
                expect(moment(updatedMatch.date).format('YYYY-MM-DD')).toEqual(moment(matchData.date).format('YYYY-MM-DD'));
                expect(updatedMatch.team1.players).toEqual(matchData.team1.players);
                expect(updatedMatch.team2.players).toEqual(matchData.team2.players);
                expect(Number(updatedMatch.team1.points)).toEqual(matchData.team1.points);
                expect(Number(updatedMatch.team2.points)).toEqual(matchData.team2.points);
                expect(updatedMatch.balls).toEqual(matchData.balls);
                expect(updatedMatch.comments).toEqual(matchData.comments);
            }

            done();
        });
    });
});

describe("DELETE /api/matches", function() {
    it("delete a match", function(done) {
        request.del(baseUrl + '/api/matches/' + firstMatchId, function(error, response, body) {
            expect(response.statusCode).toBe(200);

            done();
        });
    });
});