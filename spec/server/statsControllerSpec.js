var request = require("request"),
    moment = require('moment');

var baseUrl = "http://localhost:3000";

describe("GET /api/winningPercentages", function() {
    var startDate = moment('2016-04-03').startOf('week'),
        endDate = moment(startDate).add(6, 'days');

    it("returns status code 200", function(done) {
        request.get(
            baseUrl + '/api/winningPercentages?startDate=' + startDate.format('YYYY-MM-DD') + '&endDate=' + endDate.format('YYYY-MM-DD'),
            function(error, response, body) {
            expect(response.statusCode).toBe(200);

            done();
        });
    });

    it("returns daily winning percentages for 7 days", function(done) {
        request.get(
            baseUrl + '/api/winningPercentages?startDate=' + startDate.format('YYYY-MM-DD') + '&endDate=' + endDate.format('YYYY-MM-DD'),
            function(error, response, body) {
            var responseObject = JSON.parse(body);

            expect(responseObject.solo).toBeDefined();
            expect(responseObject.duo).toBeDefined();

            if (responseObject.solo) {
                expect(responseObject.solo.length).toEqual(7);
                expect(responseObject.solo[0].date).toBe(startDate.format('YYYY-MM-DD'));
                expect(responseObject.solo[responseObject.solo.length - 1].date).toBe(endDate.format('YYYY-MM-DD'));
                expect(responseObject.solo[0].percentages).toBeDefined();
            }

            if (responseObject.duo) {
                expect(responseObject.duo.length).toEqual(7);
                expect(responseObject.duo[0].date).toBe(startDate.format('YYYY-MM-DD'));
                expect(responseObject.duo[responseObject.duo.length - 1].date).toBe(endDate.format('YYYY-MM-DD'));
                expect(responseObject.duo[0].percentages).toBeDefined();
            }

            done();
        });
    });
});