(function () {
    'use strict';
    angular
        .module('scoreApp.controllers')
        .controller('StatsController', StatsController);

    function StatsController (Player, Statistic, moment, PERIODS){
        var self = this;

        self.playerColors = Player.colors;
        self.periods = [
            {value: PERIODS.WEEK, name: '7 jours'},
            {value: PERIODS.TWOWEEK, name: '14 jours'},
            {value: PERIODS.MONTH, name: '30 jours'},
            //{value: PERIODS.QUARTER, name: '3 mois'}
        ];

        self.selectedPeriod = PERIODS.MONTH;
        var _dateRange = Statistic.getDateRangeForPeriod(self.selectedPeriod);

        self.chartOptions = {
            animation: false,
            scaleOverride: true,
            scaleSteps: 10,
            scaleStepWidth: 10,
            scaleStartValue: 0,
            bezierCurve: false,
            pointHitDetectionRadius : 10,
            //pointDot: false,
            tooltipTemplate: "<%if (label){%><%=label%> : <%}%><%= value %> %"
        };

        self.periodStats = {
            duo: {
                leaderboard: [],
                chartData: {}
            },
            solo: {
                leaderboard: [],
                chartData: {}
            }
        };

        self.setSelectedPeriod = setSelectedPeriod;

        function setSelectedPeriod(selectedPeriod) {
            self.selectedPeriod = selectedPeriod;
            _dateRange = Statistic.getDateRangeForPeriod(selectedPeriod);

            fetchStatisticsForDateRange(_dateRange);
        }

        function fetchStatisticsForDateRange(dateRange) {
            Statistic.getWinningPercentagesForDateRange(dateRange).then(function(periodPercentages){
                var leaderboards = Statistic.createLeaderboardsFromWinningPercentages(periodPercentages);
                self.periodStats.solo.leaderboard = leaderboards.solo;
                self.periodStats.duo.leaderboard = leaderboards.duo;

                self.periodStats.solo.chartData = angular.extend(
                    self.periodStats.solo.chartData, createChartData(periodPercentages.solo)
                );
                self.periodStats.duo.chartData = angular.extend(
                    self.periodStats.duo.chartData, createChartData(periodPercentages.duo)
                );
            });
        }

        function createLabelsForInterval(startDate, endDate) {
            var currentDate = moment(startDate);
            var labels = [];

            while (currentDate.toDate() <= endDate) {
                labels.push(currentDate.format('D MMM'));

                currentDate = currentDate.add(1, 'd');
            }

            return labels;
        }

        function createChartSeries(playerPercentages) {
            var series = {};

            angular.forEach(playerPercentages, function (dayStats) {
                angular.forEach(dayStats.percentages, function (playerStats) {
                    if (!series[playerStats.player]) {
                        series[playerStats.player] = [];
                    }

                    series[playerStats.player].push(Math.round(playerStats.winPercent * 10000) / 100);
                });
            });

            return series;
        }

        function createChartData(playerPercentages) {
            var series = createChartSeries(playerPercentages);

            return {
                series: Object.keys(series),
                data: extractSeriesData(series),
                colors: getColorsForSeries(series),
                labels: createLabelsForInterval(_dateRange.startDate, _dateRange.endDate)
            };
        }

        function extractSeriesData(series) {
            var data = [];

            angular.forEach(series, function (serie, playerName) {
                data.push(serie);
            });

            return data;
        }

        function getColorsForSeries(series) {
            var colors = [];

            angular.forEach(series, function (serie, playerName) {
                colors.push(self.playerColors[playerName]);
            });

            return colors;
        }

        fetchStatisticsForDateRange(_dateRange);
    }
})();