var request = require("request"),
    mongoose = require('mongoose'),
    config = require('../../config/server'),
    moment = require('moment');

var baseUrl = "http://localhost:5000";

var firstPlayerId;

describe("GET /api/players", function() {
    it("returns status code 200", function (done) {
        request.get(baseUrl + '/api/players', function (error, response, body) {
            expect(response.statusCode).toBe(200);

            done();
        });
    });

    it("returns a list of matches", function (done) {
        request.get(baseUrl + '/api/players', function (error, response, body) {
            var players = JSON.parse(body);
            var playerIds = Object.keys(players);

            firstPlayerId = playerIds[0];

            expect(playerIds.length).toBeGreaterThan(0);

            var player = players[firstPlayerId];
            expect(player._id).toBe(firstPlayerId);
            expect(player.isDeleted).toBeFalsy();

            done();
        });
    });
});