'use strict';

describe('StatisticService', function() {
    beforeEach(module('scoreApp'));

    var statisticService,
        PERIODS,
        moment,
        $httpBackend;

    beforeEach(inject(function($injector){
        $httpBackend = $injector.get('$httpBackend');
        statisticService = $injector.get('Statistic');
        PERIODS = $injector.get('PERIODS');
        moment = $injector.get('moment');
    }));

    it("get date ranges for period", function () {
        var today = new Date();

        var weekRange = statisticService.getDateRangeForPeriod(PERIODS.WEEK);
        expect(moment(weekRange.startDate).format()).toEqual(moment(today).subtract(7, 'days').format());
        expect(moment(weekRange.endDate).format()).toEqual(moment(today).format());

        var twoWeeksRange = statisticService.getDateRangeForPeriod(PERIODS.TWOWEEK);
        expect(moment(twoWeeksRange.startDate).format()).toEqual(moment(today).subtract(14, 'days').format());
        expect(moment(twoWeeksRange.endDate).format()).toEqual(moment(today).format());

        var monthRange = statisticService.getDateRangeForPeriod(PERIODS.MONTH);
        expect(moment(monthRange.startDate).format()).toEqual(moment(today).subtract(1, 'months').format());
        expect(moment(monthRange.endDate).format()).toEqual(moment(today).format());

        var quarterRange = statisticService.getDateRangeForPeriod(PERIODS.QUARTER);
        expect(moment(quarterRange.startDate).format()).toEqual(moment(today).subtract(3, 'months').format());
        expect(moment(quarterRange.endDate).format()).toEqual(moment(today).format());
    });

    it("fetch winning percentages for date range", function(){
        var startDate = moment().subtract(7, 'days'),
            endDate = moment(),
            dateRange = {startDate: startDate.toDate(), endDate: endDate.toDate()};

        var url = '/api/winningPercentages?startDate=' + startDate.format('YYYY-MM-DD') + '&endDate=' + endDate.format('YYYY-MM-DD');
        $httpBackend.expectGET(url);
        $httpBackend.whenGET(url).respond('TEST');

        statisticService.getWinningPercentagesForDateRange(dateRange).then(function(percentages){
            expect(percentages).toEqual('TEST');
        });

        $httpBackend.flush();
    });

    it("create leaderboard from winning percentages", function () {
        var winningPercentages = {
            solo: [
                {date: '2016-04-03', percentages: [
                    {player: 'Alex', winPercent: 1, played: 1},
                    {player: 'Louis', winPercent: 0, played: 1}
                ]},
                {date: '2016-04-04', percentages: [
                    {player: 'Alex', winPercent: 0.5, played: 2},
                    {player: 'Louis', winPercent: 0.5, played: 2}
                ]}
            ],
            duo: [
                {date: '2016-04-03', percentages: [
                    {player: 'Alex', winPercent: 1, played: 1},
                    {player: 'Louis', winPercent: 0, played: 1}
                ]},
                {date: '2016-04-04', percentages: [
                    {player: 'Alex', winPercent: 0.5, played: 2},
                    {player: 'Louis', winPercent: 0.5, played: 2}
                ]}
            ]
        };

        var expectedSoloLeaderboard = [{player: 'Alex', winPercent: 50, played: 2}, {player: 'Louis', winPercent: 50, played: 2}];
        var expectedDuoLeaderboard = [{player: 'Alex', winPercent: 50, played: 2}, {player: 'Louis', winPercent: 50, played: 2}];

        var leaderboard = statisticService.createLeaderboardsFromWinningPercentages(winningPercentages);

        expect(leaderboard.solo).toEqual(expectedSoloLeaderboard);
        expect(leaderboard.duo).toEqual(expectedDuoLeaderboard);
    });
});
