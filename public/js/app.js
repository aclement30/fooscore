(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

// Declare app level module which depends on filters, and services
angular.module('scoreApp', [
        'scoreApp.controllers',
        'scoreApp.services',
        'scoreApp.directives',
        'ui.router',
        'ngMaterial',
        'ngResource',
        'ngMessages',
        'angularMoment',
        'md.data.table',
        'chart.js'
    ])
    .constant('PERIODS', {
        'WEEK': '7D',
        'TWOWEEK': '14D',
        'MONTH': '30D',
        'QUARTER': '3M'
    })
    .config([
        '$stateProvider',
        '$urlRouterProvider',
        '$mdThemingProvider',
        '$mdIconProvider',
        'ChartJsProvider',
        '$mdDateLocaleProvider',
        'moment',

        function($stateProvider, $urlRouterProvider, $mdThemingProvider, $mdIconProvider, ChartJsProvider, $mdDateLocaleProvider, moment) {
            $urlRouterProvider.otherwise('/dashboard');

            $stateProvider
                .state('dashboard', {
                    url: '/dashboard',
                    templateUrl: 'views/dashboard.html',
                    controller: 'DashboardController',
                    controllerAs: 'ctrl'
                })

                .state('stats', {
                    url: '/stats',
                    templateUrl: 'views/stats.html',
                    controller: 'StatsController',
                    controllerAs: 'ctrl'
                })

                .state('add', {
                    url: '/add',
                    templateUrl: 'views/edit-match.html',
                    controller: 'EditMatchController',
                    controllerAs: 'ctrl',
                    data: {
                        ui: {
                            addButton: false,
                            backButton: true
                        }
                    }
                })

                .state('edit', {
                    url: '/edit/:matchId',
                    templateUrl: 'views/edit-match.html',
                    controller: 'EditMatchController',
                    controllerAs: 'ctrl',
                    data: {
                        ui: {
                            addButton: false,
                            backButton: true
                        }
                    }
                });

            $mdIconProvider
                .defaultFontSet('material-icons');

            $mdThemingProvider.theme('default')
                .primaryPalette('teal')
                .accentPalette('lime')
                .warnPalette('deep-orange')
                .backgroundPalette('grey');

            ChartJsProvider.setOptions('Line', {
                scaleShowVerticalLines: false,
                maintainAspectRatio: false,
                datasetFill: false
            });

            $mdDateLocaleProvider.months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
            $mdDateLocaleProvider.shortMonths = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
            $mdDateLocaleProvider.days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
            $mdDateLocaleProvider.shortDays = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];
            $mdDateLocaleProvider.firstDayOfWeek = 1;
            $mdDateLocaleProvider.formatDate = function(date) {
                return moment(date).format('DD.MM.YYYY');
            };
            $mdDateLocaleProvider.msgCalendar = 'Calendrier';
            $mdDateLocaleProvider.msgOpenCalendar = 'Ouvrir le calendrier';
        }
    ])
    .run([
        '$rootScope',
        'amMoment',

        function ($rootScope, amMoment) {
            amMoment.changeLocale('fr');

            $rootScope.currentPage = {
                requests: {}
            };

            $rootScope.serverIsOnline = true;
            $rootScope.tasks = {};
        }
    ]);

angular.module('scoreApp.controllers', []);
angular.module('scoreApp.services', []);
angular.module('scoreApp.directives', []);

require('./controllers/AppController');
require('./controllers/DashboardController');
require('./controllers/EditMatchController');
require('./controllers/MatchController');
require('./controllers/StatsController');

require('./models/Match');

require('./services/Player');
require('./services/Statistic');
},{"./controllers/AppController":2,"./controllers/DashboardController":3,"./controllers/EditMatchController":4,"./controllers/MatchController":5,"./controllers/StatsController":6,"./models/Match":7,"./services/Player":8,"./services/Statistic":9}],2:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.controllers')
        .controller('AppController', AppController);

    function AppController ($mdSidenav, $rootScope) {
        var self = this;

        var _defaultUI = {
            addButton: true,
            backButton: true
        };

        self.ui = angular.extend({}, _defaultUI);

        $rootScope.$on('$stateChangeStart', function(event, toState){
            if (toState.data) {
                self.ui = angular.extend({}, _defaultUI, toState.data.ui);
            } else {
                self.ui = angular.extend({}, _defaultUI);
            }
        });

        self.closeMenu = closeMenu;
        self.toggleMenu = toggleMenu;

        function toggleMenu() {
            $mdSidenav('left').toggle();
        }

        function closeMenu() {
            $mdSidenav('left').close();
        }
    }
})();
},{}],3:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.controllers')
        .controller('DashboardController', DashboardController);

    function DashboardController (Match, $mdMedia, $mdDialog, $scope) {
        var self = this;

        self.matches = {};
        self.loadingPromise = {};
        self.totalCount = 0;
        self.getMatches = getMatches;
        self.showMatchDetail = showMatchDetail;
        self.fullscreenModal = $mdMedia('xs');

        self.query = {
            limit: 20,
            page: 1
        };

        function getMatches() {
            self.loadingPromise = Match.query(self.query).$promise;

            self.loadingPromise.then(function(matches){
                self.matches = matches;
                self.totalCount = Match.totalCount;
            });
        }

        function showMatchDetail(matchId, ev) {
            var useFullScreen = $mdMedia('xs') && self.fullscreenModal;

            $mdDialog.show({
                    controller: 'MatchController',
                    controllerAs: 'ctrl',
                    templateUrl: 'views/match.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {matchId: matchId}
                });

            $scope.$watch(function() {
                return $mdMedia('xs');
            }, function(wantsFullScreen) {
                self.fullscreenModal = (wantsFullScreen === true);
            });
        }

        getMatches();
    }
})();
},{}],4:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.controllers')
        .controller('EditMatchController', EditMatchController);

    function EditMatchController (Match, Player, $mdToast, $mdDialog, $stateParams, $state){
        var self = this;

        self.players = Player.names;
        self.match = {
            date: new Date(),
            team1: {
                players: [
                    null,
                    null
                ],
                points: null
            },
            team2: {
                players: [
                    null,
                    null
                ],
                points: null
            },
            balls: 1,
            comments: null
        };
        self.querySearch = querySearch;
        self.editMode = false;
        self.isSaving = false;
        self.selectPlayer = selectPlayer;
        self.save = save;
        self.removeMatch = removeMatch;

        if ($stateParams.matchId) {
            Match.get({id: $stateParams.matchId}, function(match) {
                match.date = new Date(match.date);
                self.match = match;
            });

            self.editMode = true;
        }

        function selectPlayer(team, playerIndex, player) {
            self.matchForm.team1Player2.$setValidity("uniqueTeamPlayer", validateTeamPlayer(self.match.team1));
            self.matchForm.team2Player2.$setValidity("uniqueTeamPlayer", validateTeamPlayer(self.match.team2));

            self.matchForm.team2Player1.$setValidity("uniquePlayer", validateUniquePlayer(self.match.team2, 0));
            self.matchForm.team2Player2.$setValidity("uniquePlayer", validateUniquePlayer(self.match.team2, 1));
        }

        function querySearch(query, currentSelection) {
            var selectedPlayers = [].concat(self.match.team1.players, self.match.team2.players);

            // Remove current selection from selected players
            if (currentSelection && selectedPlayers.indexOf(currentSelection) > -1) {
                selectedPlayers.splice(selectedPlayers.indexOf(currentSelection), 1);
            }

            var availablePlayers = query ? self.players.filter( createFilterFor(query) ) : [].concat(self.players);

            // Remove already selected players from available players (except current selection)
            angular.forEach(selectedPlayers, function(value, key) {
                var position = availablePlayers.indexOf(value);
                if (position > -1) {
                    availablePlayers.splice(position, 1);
                }
            });

            return availablePlayers;
        }

        function createFilterFor(query) {
            var lowercaseQuery = angular.lowercase(query);
            return function filterFn(player) {
                return (angular.lowercase(player).indexOf(lowercaseQuery) === 0);
            };
        }

        // Validate that a player is only selected once in a team
        function validateTeamPlayer(team) {
            if (team.players.length == 2) {
                if (team.players[0] == team.players[1] && team.players[0]) {
                    return false;
                }
            }

            return true;
        }

        // Validate that each player is only selected once for the match
        function validateUniquePlayer(team, playerIndex) {
            if (!team.players[playerIndex]) {
                return true;
            }

            var opponents;
            if (team.players == self.match.team2.players) {
                opponents = self.match.team1.players;
            } else {
                opponents = self.match.team2.players;
            }

            // Check for duplicate player in opponent team
            return opponents.indexOf(team.players[playerIndex]) < 0;
        }

        function save() {
            self.isSaving = true;

            var successCallback = function() {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('Match enregistré')
                        .position('top right')
                        .hideDelay(3000)
                );

                self.isSaving = false;

                $state.go('dashboard');
            };
            var errorCallback = function(response) {
                self.isSaving = false;

                var errorMessage = "erreur serveur";
                if (response.data.error) {
                    errorMessage = response.data.error.message;
                }

                $mdDialog.show(
                    $mdDialog.alert()
                        .clickOutsideToClose(true)
                        .title('Erreur')
                        .textContent('La sauvegarde a échouée (' + errorMessage + ')')
                        .ok('OK')
                );
            };

            var match;

            if (self.editMode) {
                match = self.match;

                Match.update(match, successCallback, errorCallback);
            } else {
                var match = new Match();

                match.date = self.match.date;
                match.team1 = self.match.team1;
                match.team2 = self.match.team2;
                match.balls = self.match.balls;
                match.comments = self.match.comments;

                Match.save(match, successCallback, errorCallback);
            }
        }

        function removeMatch() {
            if (confirm("Voulez-vous vraiment supprimer ce match?")) {
                self.isSaving = true;

                Match.delete({id: self.match._id}, function () {
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('Match supprimé')
                            //.action('ANNULER')
                            .highlightAction(true)
                            .position('top right')
                            .hideDelay(3000)
                    );

                    self.isSaving = false;

                    $state.go('dashboard');
                });
            }
        }
    }
})();
},{}],5:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.controllers')
        .controller('MatchController', MatchController);

    function MatchController (Match, matchId, $mdDialog, $state) {
        var self = this;

        self.match = {};
        self.editMatch = editMatch;
        self.close = close;

        Match.get({id: matchId}, function(match) {
            self.match = match;
        });

        function close() {
            $mdDialog.cancel();
        }

        function editMatch(matchId) {
            $mdDialog.cancel();

            $state.go('edit', {matchId: matchId});
        }
    }
})();
},{}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.services')
        .factory('Match', Match);

    function Match ($resource){
        var resource =  $resource('/api/matches/:id', {id:'@_id'}, {
            query: {
                method: 'GET',
                isArray: false,
                transformResponse: [function(data, headersGetter) {
                    if( headersGetter('X-Total-Count') ) {
                        resource.totalCount = Number(headersGetter('X-Total-Count'));
                    }

                    return angular.fromJson(data);
                }]
            },
            update: {
                method: 'PUT'
            }
        });

        resource.totalCount = 0;

        return resource;
    }
})();
},{}],8:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.services')
        .factory('Player', PlayerService);

    function PlayerService (){
        var players = {
            "Alexandre": {color: '#304ffe'},
            "Cédric": {color: '#aa00ff'},
            "Eugénie": {color: '#d50000'},
            "François": {color: '#0091ea'},
            "Mathieu": {color: '#00c853'},
            "Stéphane": {color: '#aeea00'},
            "Sylvain": {color: '#ff6d00'},
            "Yannick": {color: '#5d4037'}
        };

        return {
            names: (function() {
                return Object.keys(players);
            })(),
            colors: (function() {
                var colors = {};

                angular.forEach(players, function(data, name){
                    colors[name] = data.color;
                });

                return colors;
            })()
        }
    }
})();
},{}],9:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.services')
        .factory('Statistic', StatisticService);

    function StatisticService($http, moment, PERIODS){
        return {
            getDateRangeForPeriod: function(period) {
                var startDate;
                var endDate = new Date();

                switch(period) {
                    case PERIODS.WEEK:
                        startDate = moment().subtract(7, 'days').toDate();
                        break;
                    case PERIODS.TWOWEEK:
                        startDate = moment().subtract(14, 'days').toDate();
                        break;
                    case PERIODS.MONTH:
                        startDate = moment().subtract(1, 'month').toDate();
                        break;
                    case PERIODS.QUARTER:
                        startDate = moment().subtract(3, 'months').toDate();
                        break;

                }

                return {startDate: startDate, endDate: endDate};
            },

            getWinningPercentagesForDateRange: function(dateRange) {
                return $http({
                    method: 'GET',
                    url: '/api/winningPercentages?startDate=' + moment(dateRange.startDate).format('YYYY-MM-DD') + '&endDate=' + moment(dateRange.endDate).format('YYYY-MM-DD')
                }).then(function(response) {
                    return response.data;
                });
            },

            createLeaderboardsFromWinningPercentages: function(winningPercentages) {
                var transformPlayerStats = function(playerStats) {
                    var winPercent = Math.round(playerStats.winPercent * 10000) / 100;

                    return angular.extend({}, playerStats, {winPercent: winPercent});
                };

                return {
                    solo: winningPercentages.solo[winningPercentages.solo.length - 1].percentages.map(transformPlayerStats),
                    duo: winningPercentages.duo[winningPercentages.duo.length - 1].percentages.map(transformPlayerStats)
                };
            }
        };
    }
})();
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvYXBwIiwic3JjL2pzL2NvbnRyb2xsZXJzL0FwcENvbnRyb2xsZXIuanMiLCJzcmMvanMvY29udHJvbGxlcnMvRGFzaGJvYXJkQ29udHJvbGxlci5qcyIsInNyYy9qcy9jb250cm9sbGVycy9FZGl0TWF0Y2hDb250cm9sbGVyLmpzIiwic3JjL2pzL2NvbnRyb2xsZXJzL01hdGNoQ29udHJvbGxlci5qcyIsInNyYy9qcy9jb250cm9sbGVycy9TdGF0c0NvbnRyb2xsZXIuanMiLCJzcmMvanMvbW9kZWxzL01hdGNoLmpzIiwic3JjL2pzL3NlcnZpY2VzL1BsYXllci5qcyIsInNyYy9qcy9zZXJ2aWNlcy9TdGF0aXN0aWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBEZWNsYXJlIGFwcCBsZXZlbCBtb2R1bGUgd2hpY2ggZGVwZW5kcyBvbiBmaWx0ZXJzLCBhbmQgc2VydmljZXNcbmFuZ3VsYXIubW9kdWxlKCdzY29yZUFwcCcsIFtcbiAgICAgICAgJ3Njb3JlQXBwLmNvbnRyb2xsZXJzJyxcbiAgICAgICAgJ3Njb3JlQXBwLnNlcnZpY2VzJyxcbiAgICAgICAgJ3Njb3JlQXBwLmRpcmVjdGl2ZXMnLFxuICAgICAgICAndWkucm91dGVyJyxcbiAgICAgICAgJ25nTWF0ZXJpYWwnLFxuICAgICAgICAnbmdSZXNvdXJjZScsXG4gICAgICAgICduZ01lc3NhZ2VzJyxcbiAgICAgICAgJ2FuZ3VsYXJNb21lbnQnLFxuICAgICAgICAnbWQuZGF0YS50YWJsZScsXG4gICAgICAgICdjaGFydC5qcydcbiAgICBdKVxuICAgIC5jb25zdGFudCgnUEVSSU9EUycsIHtcbiAgICAgICAgJ1dFRUsnOiAnN0QnLFxuICAgICAgICAnVFdPV0VFSyc6ICcxNEQnLFxuICAgICAgICAnTU9OVEgnOiAnMzBEJyxcbiAgICAgICAgJ1FVQVJURVInOiAnM00nXG4gICAgfSlcbiAgICAuY29uZmlnKFtcbiAgICAgICAgJyRzdGF0ZVByb3ZpZGVyJyxcbiAgICAgICAgJyR1cmxSb3V0ZXJQcm92aWRlcicsXG4gICAgICAgICckbWRUaGVtaW5nUHJvdmlkZXInLFxuICAgICAgICAnJG1kSWNvblByb3ZpZGVyJyxcbiAgICAgICAgJ0NoYXJ0SnNQcm92aWRlcicsXG4gICAgICAgICckbWREYXRlTG9jYWxlUHJvdmlkZXInLFxuICAgICAgICAnbW9tZW50JyxcblxuICAgICAgICBmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkbWRUaGVtaW5nUHJvdmlkZXIsICRtZEljb25Qcm92aWRlciwgQ2hhcnRKc1Byb3ZpZGVyLCAkbWREYXRlTG9jYWxlUHJvdmlkZXIsIG1vbWVudCkge1xuICAgICAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2Rhc2hib2FyZCcpO1xuXG4gICAgICAgICAgICAkc3RhdGVQcm92aWRlclxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnZGFzaGJvYXJkJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvZGFzaGJvYXJkJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9kYXNoYm9hcmQuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiAnY3RybCdcbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdzdGF0cycsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL3N0YXRzJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9zdGF0cy5odG1sJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ1N0YXRzQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ2N0cmwnXG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYWRkJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYWRkJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9lZGl0LW1hdGNoLmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnRWRpdE1hdGNoQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1aToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZEJ1dHRvbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja0J1dHRvbjogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnZWRpdCcsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2VkaXQvOm1hdGNoSWQnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2VkaXQtbWF0Y2guaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdFZGl0TWF0Y2hDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiAnY3RybCcsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVpOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQnV0dG9uOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrQnV0dG9uOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJG1kSWNvblByb3ZpZGVyXG4gICAgICAgICAgICAgICAgLmRlZmF1bHRGb250U2V0KCdtYXRlcmlhbC1pY29ucycpO1xuXG4gICAgICAgICAgICAkbWRUaGVtaW5nUHJvdmlkZXIudGhlbWUoJ2RlZmF1bHQnKVxuICAgICAgICAgICAgICAgIC5wcmltYXJ5UGFsZXR0ZSgndGVhbCcpXG4gICAgICAgICAgICAgICAgLmFjY2VudFBhbGV0dGUoJ2xpbWUnKVxuICAgICAgICAgICAgICAgIC53YXJuUGFsZXR0ZSgnZGVlcC1vcmFuZ2UnKVxuICAgICAgICAgICAgICAgIC5iYWNrZ3JvdW5kUGFsZXR0ZSgnZ3JleScpO1xuXG4gICAgICAgICAgICBDaGFydEpzUHJvdmlkZXIuc2V0T3B0aW9ucygnTGluZScsIHtcbiAgICAgICAgICAgICAgICBzY2FsZVNob3dWZXJ0aWNhbExpbmVzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtYWludGFpbkFzcGVjdFJhdGlvOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBkYXRhc2V0RmlsbDogZmFsc2VcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAkbWREYXRlTG9jYWxlUHJvdmlkZXIubW9udGhzID0gWydqYW52aWVyJywgJ2bDqXZyaWVyJywgJ21hcnMnLCAnYXZyaWwnLCAnbWFpJywgJ2p1aW4nLCAnanVpbGxldCcsICdhb8O7dCcsICdzZXB0ZW1icmUnLCAnb2N0b2JyZScsICdub3ZlbWJyZScsICdkw6ljZW1icmUnXTtcbiAgICAgICAgICAgICRtZERhdGVMb2NhbGVQcm92aWRlci5zaG9ydE1vbnRocyA9IFsnamFudi4nLCAnZsOpdnIuJywgJ21hcnMnLCAnYXZyaWwnLCAnbWFpJywgJ2p1aW4nLCAnanVpbC4nLCAnYW/Du3QnLCAnc2VwdC4nLCAnb2N0LicsICdub3YuJywgJ2TDqWMuJ107XG4gICAgICAgICAgICAkbWREYXRlTG9jYWxlUHJvdmlkZXIuZGF5cyA9IFsnZGltYW5jaGUnLCAnbHVuZGknLCAnbWFyZGknLCAnbWVyY3JlZGknLCAnamV1ZGknLCAndmVuZHJlZGknLCAnc2FtZWRpJ107XG4gICAgICAgICAgICAkbWREYXRlTG9jYWxlUHJvdmlkZXIuc2hvcnREYXlzID0gWydEaScsICdMdScsICdNYScsICdNZScsICdKZScsICdWZScsICdTYSddO1xuICAgICAgICAgICAgJG1kRGF0ZUxvY2FsZVByb3ZpZGVyLmZpcnN0RGF5T2ZXZWVrID0gMTtcbiAgICAgICAgICAgICRtZERhdGVMb2NhbGVQcm92aWRlci5mb3JtYXREYXRlID0gZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtb21lbnQoZGF0ZSkuZm9ybWF0KCdERC5NTS5ZWVlZJyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJG1kRGF0ZUxvY2FsZVByb3ZpZGVyLm1zZ0NhbGVuZGFyID0gJ0NhbGVuZHJpZXInO1xuICAgICAgICAgICAgJG1kRGF0ZUxvY2FsZVByb3ZpZGVyLm1zZ09wZW5DYWxlbmRhciA9ICdPdXZyaXIgbGUgY2FsZW5kcmllcic7XG4gICAgICAgIH1cbiAgICBdKVxuICAgIC5ydW4oW1xuICAgICAgICAnJHJvb3RTY29wZScsXG4gICAgICAgICdhbU1vbWVudCcsXG5cbiAgICAgICAgZnVuY3Rpb24gKCRyb290U2NvcGUsIGFtTW9tZW50KSB7XG4gICAgICAgICAgICBhbU1vbWVudC5jaGFuZ2VMb2NhbGUoJ2ZyJyk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFBhZ2UgPSB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdHM6IHt9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLnNlcnZlcklzT25saW5lID0gdHJ1ZTtcbiAgICAgICAgICAgICRyb290U2NvcGUudGFza3MgPSB7fTtcbiAgICAgICAgfVxuICAgIF0pO1xuXG5hbmd1bGFyLm1vZHVsZSgnc2NvcmVBcHAuY29udHJvbGxlcnMnLCBbXSk7XG5hbmd1bGFyLm1vZHVsZSgnc2NvcmVBcHAuc2VydmljZXMnLCBbXSk7XG5hbmd1bGFyLm1vZHVsZSgnc2NvcmVBcHAuZGlyZWN0aXZlcycsIFtdKTtcblxucmVxdWlyZSgnLi9jb250cm9sbGVycy9BcHBDb250cm9sbGVyJyk7XG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL0Rhc2hib2FyZENvbnRyb2xsZXInKTtcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvRWRpdE1hdGNoQ29udHJvbGxlcicpO1xucmVxdWlyZSgnLi9jb250cm9sbGVycy9NYXRjaENvbnRyb2xsZXInKTtcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvU3RhdHNDb250cm9sbGVyJyk7XG5cbnJlcXVpcmUoJy4vbW9kZWxzL01hdGNoJyk7XG5cbnJlcXVpcmUoJy4vc2VydmljZXMvUGxheWVyJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2VzL1N0YXRpc3RpYycpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnc2NvcmVBcHAuY29udHJvbGxlcnMnKVxuICAgICAgICAuY29udHJvbGxlcignQXBwQ29udHJvbGxlcicsIEFwcENvbnRyb2xsZXIpO1xuXG4gICAgZnVuY3Rpb24gQXBwQ29udHJvbGxlciAoJG1kU2lkZW5hdiwgJHJvb3RTY29wZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdmFyIF9kZWZhdWx0VUkgPSB7XG4gICAgICAgICAgICBhZGRCdXR0b246IHRydWUsXG4gICAgICAgICAgICBiYWNrQnV0dG9uOiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi51aSA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCBfZGVmYXVsdFVJKTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSl7XG4gICAgICAgICAgICBpZiAodG9TdGF0ZS5kYXRhKSB7XG4gICAgICAgICAgICAgICAgc2VsZi51aSA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCBfZGVmYXVsdFVJLCB0b1N0YXRlLmRhdGEudWkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLnVpID0gYW5ndWxhci5leHRlbmQoe30sIF9kZWZhdWx0VUkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBzZWxmLmNsb3NlTWVudSA9IGNsb3NlTWVudTtcbiAgICAgICAgc2VsZi50b2dnbGVNZW51ID0gdG9nZ2xlTWVudTtcblxuICAgICAgICBmdW5jdGlvbiB0b2dnbGVNZW51KCkge1xuICAgICAgICAgICAgJG1kU2lkZW5hdignbGVmdCcpLnRvZ2dsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY2xvc2VNZW51KCkge1xuICAgICAgICAgICAgJG1kU2lkZW5hdignbGVmdCcpLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnc2NvcmVBcHAuY29udHJvbGxlcnMnKVxuICAgICAgICAuY29udHJvbGxlcignRGFzaGJvYXJkQ29udHJvbGxlcicsIERhc2hib2FyZENvbnRyb2xsZXIpO1xuXG4gICAgZnVuY3Rpb24gRGFzaGJvYXJkQ29udHJvbGxlciAoTWF0Y2gsICRtZE1lZGlhLCAkbWREaWFsb2csICRzY29wZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi5tYXRjaGVzID0ge307XG4gICAgICAgIHNlbGYubG9hZGluZ1Byb21pc2UgPSB7fTtcbiAgICAgICAgc2VsZi50b3RhbENvdW50ID0gMDtcbiAgICAgICAgc2VsZi5nZXRNYXRjaGVzID0gZ2V0TWF0Y2hlcztcbiAgICAgICAgc2VsZi5zaG93TWF0Y2hEZXRhaWwgPSBzaG93TWF0Y2hEZXRhaWw7XG4gICAgICAgIHNlbGYuZnVsbHNjcmVlbk1vZGFsID0gJG1kTWVkaWEoJ3hzJyk7XG5cbiAgICAgICAgc2VsZi5xdWVyeSA9IHtcbiAgICAgICAgICAgIGxpbWl0OiAyMCxcbiAgICAgICAgICAgIHBhZ2U6IDFcbiAgICAgICAgfTtcblxuICAgICAgICBmdW5jdGlvbiBnZXRNYXRjaGVzKCkge1xuICAgICAgICAgICAgc2VsZi5sb2FkaW5nUHJvbWlzZSA9IE1hdGNoLnF1ZXJ5KHNlbGYucXVlcnkpLiRwcm9taXNlO1xuXG4gICAgICAgICAgICBzZWxmLmxvYWRpbmdQcm9taXNlLnRoZW4oZnVuY3Rpb24obWF0Y2hlcyl7XG4gICAgICAgICAgICAgICAgc2VsZi5tYXRjaGVzID0gbWF0Y2hlcztcbiAgICAgICAgICAgICAgICBzZWxmLnRvdGFsQ291bnQgPSBNYXRjaC50b3RhbENvdW50O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBzaG93TWF0Y2hEZXRhaWwobWF0Y2hJZCwgZXYpIHtcbiAgICAgICAgICAgIHZhciB1c2VGdWxsU2NyZWVuID0gJG1kTWVkaWEoJ3hzJykgJiYgc2VsZi5mdWxsc2NyZWVuTW9kYWw7XG5cbiAgICAgICAgICAgICRtZERpYWxvZy5zaG93KHtcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ01hdGNoQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21hdGNoLmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5ib2R5KSxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0RXZlbnQ6IGV2LFxuICAgICAgICAgICAgICAgICAgICBjbGlja091dHNpZGVUb0Nsb3NlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBmdWxsc2NyZWVuOiB1c2VGdWxsU2NyZWVuLFxuICAgICAgICAgICAgICAgICAgICBsb2NhbHM6IHttYXRjaElkOiBtYXRjaElkfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkbWRNZWRpYSgneHMnKTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKHdhbnRzRnVsbFNjcmVlbikge1xuICAgICAgICAgICAgICAgIHNlbGYuZnVsbHNjcmVlbk1vZGFsID0gKHdhbnRzRnVsbFNjcmVlbiA9PT0gdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldE1hdGNoZXMoKTtcbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnc2NvcmVBcHAuY29udHJvbGxlcnMnKVxuICAgICAgICAuY29udHJvbGxlcignRWRpdE1hdGNoQ29udHJvbGxlcicsIEVkaXRNYXRjaENvbnRyb2xsZXIpO1xuXG4gICAgZnVuY3Rpb24gRWRpdE1hdGNoQ29udHJvbGxlciAoTWF0Y2gsIFBsYXllciwgJG1kVG9hc3QsICRtZERpYWxvZywgJHN0YXRlUGFyYW1zLCAkc3RhdGUpe1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi5wbGF5ZXJzID0gUGxheWVyLm5hbWVzO1xuICAgICAgICBzZWxmLm1hdGNoID0ge1xuICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoKSxcbiAgICAgICAgICAgIHRlYW0xOiB7XG4gICAgICAgICAgICAgICAgcGxheWVyczogW1xuICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICBudWxsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBwb2ludHM6IG51bGxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZWFtMjoge1xuICAgICAgICAgICAgICAgIHBsYXllcnM6IFtcbiAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbnVsbFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgcG9pbnRzOiBudWxsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsbHM6IDEsXG4gICAgICAgICAgICBjb21tZW50czogbnVsbFxuICAgICAgICB9O1xuICAgICAgICBzZWxmLnF1ZXJ5U2VhcmNoID0gcXVlcnlTZWFyY2g7XG4gICAgICAgIHNlbGYuZWRpdE1vZGUgPSBmYWxzZTtcbiAgICAgICAgc2VsZi5pc1NhdmluZyA9IGZhbHNlO1xuICAgICAgICBzZWxmLnNlbGVjdFBsYXllciA9IHNlbGVjdFBsYXllcjtcbiAgICAgICAgc2VsZi5zYXZlID0gc2F2ZTtcbiAgICAgICAgc2VsZi5yZW1vdmVNYXRjaCA9IHJlbW92ZU1hdGNoO1xuXG4gICAgICAgIGlmICgkc3RhdGVQYXJhbXMubWF0Y2hJZCkge1xuICAgICAgICAgICAgTWF0Y2guZ2V0KHtpZDogJHN0YXRlUGFyYW1zLm1hdGNoSWR9LCBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgICAgICAgICAgIG1hdGNoLmRhdGUgPSBuZXcgRGF0ZShtYXRjaC5kYXRlKTtcbiAgICAgICAgICAgICAgICBzZWxmLm1hdGNoID0gbWF0Y2g7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgc2VsZi5lZGl0TW9kZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBzZWxlY3RQbGF5ZXIodGVhbSwgcGxheWVySW5kZXgsIHBsYXllcikge1xuICAgICAgICAgICAgc2VsZi5tYXRjaEZvcm0udGVhbTFQbGF5ZXIyLiRzZXRWYWxpZGl0eShcInVuaXF1ZVRlYW1QbGF5ZXJcIiwgdmFsaWRhdGVUZWFtUGxheWVyKHNlbGYubWF0Y2gudGVhbTEpKTtcbiAgICAgICAgICAgIHNlbGYubWF0Y2hGb3JtLnRlYW0yUGxheWVyMi4kc2V0VmFsaWRpdHkoXCJ1bmlxdWVUZWFtUGxheWVyXCIsIHZhbGlkYXRlVGVhbVBsYXllcihzZWxmLm1hdGNoLnRlYW0yKSk7XG5cbiAgICAgICAgICAgIHNlbGYubWF0Y2hGb3JtLnRlYW0yUGxheWVyMS4kc2V0VmFsaWRpdHkoXCJ1bmlxdWVQbGF5ZXJcIiwgdmFsaWRhdGVVbmlxdWVQbGF5ZXIoc2VsZi5tYXRjaC50ZWFtMiwgMCkpO1xuICAgICAgICAgICAgc2VsZi5tYXRjaEZvcm0udGVhbTJQbGF5ZXIyLiRzZXRWYWxpZGl0eShcInVuaXF1ZVBsYXllclwiLCB2YWxpZGF0ZVVuaXF1ZVBsYXllcihzZWxmLm1hdGNoLnRlYW0yLCAxKSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBxdWVyeVNlYXJjaChxdWVyeSwgY3VycmVudFNlbGVjdGlvbikge1xuICAgICAgICAgICAgdmFyIHNlbGVjdGVkUGxheWVycyA9IFtdLmNvbmNhdChzZWxmLm1hdGNoLnRlYW0xLnBsYXllcnMsIHNlbGYubWF0Y2gudGVhbTIucGxheWVycyk7XG5cbiAgICAgICAgICAgIC8vIFJlbW92ZSBjdXJyZW50IHNlbGVjdGlvbiBmcm9tIHNlbGVjdGVkIHBsYXllcnNcbiAgICAgICAgICAgIGlmIChjdXJyZW50U2VsZWN0aW9uICYmIHNlbGVjdGVkUGxheWVycy5pbmRleE9mKGN1cnJlbnRTZWxlY3Rpb24pID4gLTEpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZFBsYXllcnMuc3BsaWNlKHNlbGVjdGVkUGxheWVycy5pbmRleE9mKGN1cnJlbnRTZWxlY3Rpb24pLCAxKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGF2YWlsYWJsZVBsYXllcnMgPSBxdWVyeSA/IHNlbGYucGxheWVycy5maWx0ZXIoIGNyZWF0ZUZpbHRlckZvcihxdWVyeSkgKSA6IFtdLmNvbmNhdChzZWxmLnBsYXllcnMpO1xuXG4gICAgICAgICAgICAvLyBSZW1vdmUgYWxyZWFkeSBzZWxlY3RlZCBwbGF5ZXJzIGZyb20gYXZhaWxhYmxlIHBsYXllcnMgKGV4Y2VwdCBjdXJyZW50IHNlbGVjdGlvbilcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxlY3RlZFBsYXllcnMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgICAgICB2YXIgcG9zaXRpb24gPSBhdmFpbGFibGVQbGF5ZXJzLmluZGV4T2YodmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZVBsYXllcnMuc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGF2YWlsYWJsZVBsYXllcnM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVGaWx0ZXJGb3IocXVlcnkpIHtcbiAgICAgICAgICAgIHZhciBsb3dlcmNhc2VRdWVyeSA9IGFuZ3VsYXIubG93ZXJjYXNlKHF1ZXJ5KTtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBmaWx0ZXJGbihwbGF5ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGFuZ3VsYXIubG93ZXJjYXNlKHBsYXllcikuaW5kZXhPZihsb3dlcmNhc2VRdWVyeSkgPT09IDApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIHRoYXQgYSBwbGF5ZXIgaXMgb25seSBzZWxlY3RlZCBvbmNlIGluIGEgdGVhbVxuICAgICAgICBmdW5jdGlvbiB2YWxpZGF0ZVRlYW1QbGF5ZXIodGVhbSkge1xuICAgICAgICAgICAgaWYgKHRlYW0ucGxheWVycy5sZW5ndGggPT0gMikge1xuICAgICAgICAgICAgICAgIGlmICh0ZWFtLnBsYXllcnNbMF0gPT0gdGVhbS5wbGF5ZXJzWzFdICYmIHRlYW0ucGxheWVyc1swXSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIHRoYXQgZWFjaCBwbGF5ZXIgaXMgb25seSBzZWxlY3RlZCBvbmNlIGZvciB0aGUgbWF0Y2hcbiAgICAgICAgZnVuY3Rpb24gdmFsaWRhdGVVbmlxdWVQbGF5ZXIodGVhbSwgcGxheWVySW5kZXgpIHtcbiAgICAgICAgICAgIGlmICghdGVhbS5wbGF5ZXJzW3BsYXllckluZGV4XSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgb3Bwb25lbnRzO1xuICAgICAgICAgICAgaWYgKHRlYW0ucGxheWVycyA9PSBzZWxmLm1hdGNoLnRlYW0yLnBsYXllcnMpIHtcbiAgICAgICAgICAgICAgICBvcHBvbmVudHMgPSBzZWxmLm1hdGNoLnRlYW0xLnBsYXllcnM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9wcG9uZW50cyA9IHNlbGYubWF0Y2gudGVhbTIucGxheWVycztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGR1cGxpY2F0ZSBwbGF5ZXIgaW4gb3Bwb25lbnQgdGVhbVxuICAgICAgICAgICAgcmV0dXJuIG9wcG9uZW50cy5pbmRleE9mKHRlYW0ucGxheWVyc1twbGF5ZXJJbmRleF0pIDwgMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNhdmUoKSB7XG4gICAgICAgICAgICBzZWxmLmlzU2F2aW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgdmFyIHN1Y2Nlc3NDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRtZFRvYXN0LnNob3coXG4gICAgICAgICAgICAgICAgICAgICRtZFRvYXN0LnNpbXBsZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGV4dENvbnRlbnQoJ01hdGNoIGVucmVnaXN0csOpJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5wb3NpdGlvbigndG9wIHJpZ2h0JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5oaWRlRGVsYXkoMzAwMClcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgc2VsZi5pc1NhdmluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdkYXNoYm9hcmQnKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgZXJyb3JDYWxsYmFjayA9IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5pc1NhdmluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgdmFyIGVycm9yTWVzc2FnZSA9IFwiZXJyZXVyIHNlcnZldXJcIjtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YS5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSByZXNwb25zZS5kYXRhLmVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgJG1kRGlhbG9nLnNob3coXG4gICAgICAgICAgICAgICAgICAgICRtZERpYWxvZy5hbGVydCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY2xpY2tPdXRzaWRlVG9DbG9zZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRpdGxlKCdFcnJldXInKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRleHRDb250ZW50KCdMYSBzYXV2ZWdhcmRlIGEgw6ljaG91w6llICgnICsgZXJyb3JNZXNzYWdlICsgJyknKVxuICAgICAgICAgICAgICAgICAgICAgICAgLm9rKCdPSycpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBtYXRjaDtcblxuICAgICAgICAgICAgaWYgKHNlbGYuZWRpdE1vZGUpIHtcbiAgICAgICAgICAgICAgICBtYXRjaCA9IHNlbGYubWF0Y2g7XG5cbiAgICAgICAgICAgICAgICBNYXRjaC51cGRhdGUobWF0Y2gsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjayk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IG5ldyBNYXRjaCgpO1xuXG4gICAgICAgICAgICAgICAgbWF0Y2guZGF0ZSA9IHNlbGYubWF0Y2guZGF0ZTtcbiAgICAgICAgICAgICAgICBtYXRjaC50ZWFtMSA9IHNlbGYubWF0Y2gudGVhbTE7XG4gICAgICAgICAgICAgICAgbWF0Y2gudGVhbTIgPSBzZWxmLm1hdGNoLnRlYW0yO1xuICAgICAgICAgICAgICAgIG1hdGNoLmJhbGxzID0gc2VsZi5tYXRjaC5iYWxscztcbiAgICAgICAgICAgICAgICBtYXRjaC5jb21tZW50cyA9IHNlbGYubWF0Y2guY29tbWVudHM7XG5cbiAgICAgICAgICAgICAgICBNYXRjaC5zYXZlKG1hdGNoLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmVtb3ZlTWF0Y2goKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlybShcIlZvdWxlei12b3VzIHZyYWltZW50IHN1cHByaW1lciBjZSBtYXRjaD9cIikpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmlzU2F2aW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIE1hdGNoLmRlbGV0ZSh7aWQ6IHNlbGYubWF0Y2guX2lkfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkbWRUb2FzdC5zaG93KFxuICAgICAgICAgICAgICAgICAgICAgICAgJG1kVG9hc3Quc2ltcGxlKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGV4dENvbnRlbnQoJ01hdGNoIHN1cHByaW3DqScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8uYWN0aW9uKCdBTk5VTEVSJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuaGlnaGxpZ2h0QWN0aW9uKHRydWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBvc2l0aW9uKCd0b3AgcmlnaHQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5oaWRlRGVsYXkoMzAwMClcbiAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLmlzU2F2aW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdkYXNoYm9hcmQnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5jb250cm9sbGVycycpXG4gICAgICAgIC5jb250cm9sbGVyKCdNYXRjaENvbnRyb2xsZXInLCBNYXRjaENvbnRyb2xsZXIpO1xuXG4gICAgZnVuY3Rpb24gTWF0Y2hDb250cm9sbGVyIChNYXRjaCwgbWF0Y2hJZCwgJG1kRGlhbG9nLCAkc3RhdGUpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYubWF0Y2ggPSB7fTtcbiAgICAgICAgc2VsZi5lZGl0TWF0Y2ggPSBlZGl0TWF0Y2g7XG4gICAgICAgIHNlbGYuY2xvc2UgPSBjbG9zZTtcblxuICAgICAgICBNYXRjaC5nZXQoe2lkOiBtYXRjaElkfSwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgICAgICAgIHNlbGYubWF0Y2ggPSBtYXRjaDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgICAgICAgICAkbWREaWFsb2cuY2FuY2VsKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlZGl0TWF0Y2gobWF0Y2hJZCkge1xuICAgICAgICAgICAgJG1kRGlhbG9nLmNhbmNlbCgpO1xuXG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2VkaXQnLCB7bWF0Y2hJZDogbWF0Y2hJZH0pO1xuICAgICAgICB9XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ3Njb3JlQXBwLmNvbnRyb2xsZXJzJylcbiAgICAgICAgLmNvbnRyb2xsZXIoJ1N0YXRzQ29udHJvbGxlcicsIFN0YXRzQ29udHJvbGxlcik7XG5cbiAgICBmdW5jdGlvbiBTdGF0c0NvbnRyb2xsZXIgKFBsYXllciwgU3RhdGlzdGljLCBtb21lbnQsIFBFUklPRFMpe1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi5wbGF5ZXJDb2xvcnMgPSBQbGF5ZXIuY29sb3JzO1xuICAgICAgICBzZWxmLnBlcmlvZHMgPSBbXG4gICAgICAgICAgICB7dmFsdWU6IFBFUklPRFMuV0VFSywgbmFtZTogJzcgam91cnMnfSxcbiAgICAgICAgICAgIHt2YWx1ZTogUEVSSU9EUy5UV09XRUVLLCBuYW1lOiAnMTQgam91cnMnfSxcbiAgICAgICAgICAgIHt2YWx1ZTogUEVSSU9EUy5NT05USCwgbmFtZTogJzMwIGpvdXJzJ30sXG4gICAgICAgICAgICAvL3t2YWx1ZTogUEVSSU9EUy5RVUFSVEVSLCBuYW1lOiAnMyBtb2lzJ31cbiAgICAgICAgXTtcblxuICAgICAgICBzZWxmLnNlbGVjdGVkUGVyaW9kID0gUEVSSU9EUy5NT05USDtcbiAgICAgICAgdmFyIF9kYXRlUmFuZ2UgPSBTdGF0aXN0aWMuZ2V0RGF0ZVJhbmdlRm9yUGVyaW9kKHNlbGYuc2VsZWN0ZWRQZXJpb2QpO1xuXG4gICAgICAgIHNlbGYuY2hhcnRPcHRpb25zID0ge1xuICAgICAgICAgICAgYW5pbWF0aW9uOiBmYWxzZSxcbiAgICAgICAgICAgIHNjYWxlT3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICBzY2FsZVN0ZXBzOiAxMCxcbiAgICAgICAgICAgIHNjYWxlU3RlcFdpZHRoOiAxMCxcbiAgICAgICAgICAgIHNjYWxlU3RhcnRWYWx1ZTogMCxcbiAgICAgICAgICAgIGJlemllckN1cnZlOiBmYWxzZSxcbiAgICAgICAgICAgIHBvaW50SGl0RGV0ZWN0aW9uUmFkaXVzIDogMTAsXG4gICAgICAgICAgICAvL3BvaW50RG90OiBmYWxzZSxcbiAgICAgICAgICAgIHRvb2x0aXBUZW1wbGF0ZTogXCI8JWlmIChsYWJlbCl7JT48JT1sYWJlbCU+IDogPCV9JT48JT0gdmFsdWUgJT4gJVwiXG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5wZXJpb2RTdGF0cyA9IHtcbiAgICAgICAgICAgIGR1bzoge1xuICAgICAgICAgICAgICAgIGxlYWRlcmJvYXJkOiBbXSxcbiAgICAgICAgICAgICAgICBjaGFydERhdGE6IHt9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc29sbzoge1xuICAgICAgICAgICAgICAgIGxlYWRlcmJvYXJkOiBbXSxcbiAgICAgICAgICAgICAgICBjaGFydERhdGE6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5zZXRTZWxlY3RlZFBlcmlvZCA9IHNldFNlbGVjdGVkUGVyaW9kO1xuXG4gICAgICAgIGZ1bmN0aW9uIHNldFNlbGVjdGVkUGVyaW9kKHNlbGVjdGVkUGVyaW9kKSB7XG4gICAgICAgICAgICBzZWxmLnNlbGVjdGVkUGVyaW9kID0gc2VsZWN0ZWRQZXJpb2Q7XG4gICAgICAgICAgICBfZGF0ZVJhbmdlID0gU3RhdGlzdGljLmdldERhdGVSYW5nZUZvclBlcmlvZChzZWxlY3RlZFBlcmlvZCk7XG5cbiAgICAgICAgICAgIGZldGNoU3RhdGlzdGljc0ZvckRhdGVSYW5nZShfZGF0ZVJhbmdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGZldGNoU3RhdGlzdGljc0ZvckRhdGVSYW5nZShkYXRlUmFuZ2UpIHtcbiAgICAgICAgICAgIFN0YXRpc3RpYy5nZXRXaW5uaW5nUGVyY2VudGFnZXNGb3JEYXRlUmFuZ2UoZGF0ZVJhbmdlKS50aGVuKGZ1bmN0aW9uKHBlcmlvZFBlcmNlbnRhZ2VzKXtcbiAgICAgICAgICAgICAgICB2YXIgbGVhZGVyYm9hcmRzID0gU3RhdGlzdGljLmNyZWF0ZUxlYWRlcmJvYXJkc0Zyb21XaW5uaW5nUGVyY2VudGFnZXMocGVyaW9kUGVyY2VudGFnZXMpO1xuICAgICAgICAgICAgICAgIHNlbGYucGVyaW9kU3RhdHMuc29sby5sZWFkZXJib2FyZCA9IGxlYWRlcmJvYXJkcy5zb2xvO1xuICAgICAgICAgICAgICAgIHNlbGYucGVyaW9kU3RhdHMuZHVvLmxlYWRlcmJvYXJkID0gbGVhZGVyYm9hcmRzLmR1bztcblxuICAgICAgICAgICAgICAgIHNlbGYucGVyaW9kU3RhdHMuc29sby5jaGFydERhdGEgPSBhbmd1bGFyLmV4dGVuZChcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5wZXJpb2RTdGF0cy5zb2xvLmNoYXJ0RGF0YSwgY3JlYXRlQ2hhcnREYXRhKHBlcmlvZFBlcmNlbnRhZ2VzLnNvbG8pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBzZWxmLnBlcmlvZFN0YXRzLmR1by5jaGFydERhdGEgPSBhbmd1bGFyLmV4dGVuZChcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5wZXJpb2RTdGF0cy5kdW8uY2hhcnREYXRhLCBjcmVhdGVDaGFydERhdGEocGVyaW9kUGVyY2VudGFnZXMuZHVvKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUxhYmVsc0ZvckludGVydmFsKHN0YXJ0RGF0ZSwgZW5kRGF0ZSkge1xuICAgICAgICAgICAgdmFyIGN1cnJlbnREYXRlID0gbW9tZW50KHN0YXJ0RGF0ZSk7XG4gICAgICAgICAgICB2YXIgbGFiZWxzID0gW107XG5cbiAgICAgICAgICAgIHdoaWxlIChjdXJyZW50RGF0ZS50b0RhdGUoKSA8PSBlbmREYXRlKSB7XG4gICAgICAgICAgICAgICAgbGFiZWxzLnB1c2goY3VycmVudERhdGUuZm9ybWF0KCdEIE1NTScpKTtcblxuICAgICAgICAgICAgICAgIGN1cnJlbnREYXRlID0gY3VycmVudERhdGUuYWRkKDEsICdkJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBsYWJlbHM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVDaGFydFNlcmllcyhwbGF5ZXJQZXJjZW50YWdlcykge1xuICAgICAgICAgICAgdmFyIHNlcmllcyA9IHt9O1xuXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2gocGxheWVyUGVyY2VudGFnZXMsIGZ1bmN0aW9uIChkYXlTdGF0cykge1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChkYXlTdGF0cy5wZXJjZW50YWdlcywgZnVuY3Rpb24gKHBsYXllclN0YXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2VyaWVzW3BsYXllclN0YXRzLnBsYXllcl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc1twbGF5ZXJTdGF0cy5wbGF5ZXJdID0gW107XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBzZXJpZXNbcGxheWVyU3RhdHMucGxheWVyXS5wdXNoKE1hdGgucm91bmQocGxheWVyU3RhdHMud2luUGVyY2VudCAqIDEwMDAwKSAvIDEwMCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHNlcmllcztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUNoYXJ0RGF0YShwbGF5ZXJQZXJjZW50YWdlcykge1xuICAgICAgICAgICAgdmFyIHNlcmllcyA9IGNyZWF0ZUNoYXJ0U2VyaWVzKHBsYXllclBlcmNlbnRhZ2VzKTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzZXJpZXM6IE9iamVjdC5rZXlzKHNlcmllcyksXG4gICAgICAgICAgICAgICAgZGF0YTogZXh0cmFjdFNlcmllc0RhdGEoc2VyaWVzKSxcbiAgICAgICAgICAgICAgICBjb2xvcnM6IGdldENvbG9yc0ZvclNlcmllcyhzZXJpZXMpLFxuICAgICAgICAgICAgICAgIGxhYmVsczogY3JlYXRlTGFiZWxzRm9ySW50ZXJ2YWwoX2RhdGVSYW5nZS5zdGFydERhdGUsIF9kYXRlUmFuZ2UuZW5kRGF0ZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBleHRyYWN0U2VyaWVzRGF0YShzZXJpZXMpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gW107XG5cbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZXJpZXMsIGZ1bmN0aW9uIChzZXJpZSwgcGxheWVyTmFtZSkge1xuICAgICAgICAgICAgICAgIGRhdGEucHVzaChzZXJpZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRDb2xvcnNGb3JTZXJpZXMoc2VyaWVzKSB7XG4gICAgICAgICAgICB2YXIgY29sb3JzID0gW107XG5cbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZXJpZXMsIGZ1bmN0aW9uIChzZXJpZSwgcGxheWVyTmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbG9ycy5wdXNoKHNlbGYucGxheWVyQ29sb3JzW3BsYXllck5hbWVdKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gY29sb3JzO1xuICAgICAgICB9XG5cbiAgICAgICAgZmV0Y2hTdGF0aXN0aWNzRm9yRGF0ZVJhbmdlKF9kYXRlUmFuZ2UpO1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5zZXJ2aWNlcycpXG4gICAgICAgIC5mYWN0b3J5KCdNYXRjaCcsIE1hdGNoKTtcblxuICAgIGZ1bmN0aW9uIE1hdGNoICgkcmVzb3VyY2Upe1xuICAgICAgICB2YXIgcmVzb3VyY2UgPSAgJHJlc291cmNlKCcvYXBpL21hdGNoZXMvOmlkJywge2lkOidAX2lkJ30sIHtcbiAgICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICBpc0FycmF5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW2Z1bmN0aW9uKGRhdGEsIGhlYWRlcnNHZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoIGhlYWRlcnNHZXR0ZXIoJ1gtVG90YWwtQ291bnQnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlLnRvdGFsQ291bnQgPSBOdW1iZXIoaGVhZGVyc0dldHRlcignWC1Ub3RhbC1Db3VudCcpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmZyb21Kc29uKGRhdGEpO1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBkYXRlOiB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUFVUJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXNvdXJjZS50b3RhbENvdW50ID0gMDtcblxuICAgICAgICByZXR1cm4gcmVzb3VyY2U7XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ3Njb3JlQXBwLnNlcnZpY2VzJylcbiAgICAgICAgLmZhY3RvcnkoJ1BsYXllcicsIFBsYXllclNlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gUGxheWVyU2VydmljZSAoKXtcbiAgICAgICAgdmFyIHBsYXllcnMgPSB7XG4gICAgICAgICAgICBcIkFsZXhhbmRyZVwiOiB7Y29sb3I6ICcjMzA0ZmZlJ30sXG4gICAgICAgICAgICBcIkPDqWRyaWNcIjoge2NvbG9yOiAnI2FhMDBmZid9LFxuICAgICAgICAgICAgXCJFdWfDqW5pZVwiOiB7Y29sb3I6ICcjZDUwMDAwJ30sXG4gICAgICAgICAgICBcIkZyYW7Dp29pc1wiOiB7Y29sb3I6ICcjMDA5MWVhJ30sXG4gICAgICAgICAgICBcIk1hdGhpZXVcIjoge2NvbG9yOiAnIzAwYzg1Myd9LFxuICAgICAgICAgICAgXCJTdMOpcGhhbmVcIjoge2NvbG9yOiAnI2FlZWEwMCd9LFxuICAgICAgICAgICAgXCJTeWx2YWluXCI6IHtjb2xvcjogJyNmZjZkMDAnfSxcbiAgICAgICAgICAgIFwiWWFubmlja1wiOiB7Y29sb3I6ICcjNWQ0MDM3J31cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZXM6IChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMocGxheWVycyk7XG4gICAgICAgICAgICB9KSgpLFxuICAgICAgICAgICAgY29sb3JzOiAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbG9ycyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHBsYXllcnMsIGZ1bmN0aW9uKGRhdGEsIG5hbWUpe1xuICAgICAgICAgICAgICAgICAgICBjb2xvcnNbbmFtZV0gPSBkYXRhLmNvbG9yO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbG9ycztcbiAgICAgICAgICAgIH0pKClcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5zZXJ2aWNlcycpXG4gICAgICAgIC5mYWN0b3J5KCdTdGF0aXN0aWMnLCBTdGF0aXN0aWNTZXJ2aWNlKTtcblxuICAgIGZ1bmN0aW9uIFN0YXRpc3RpY1NlcnZpY2UoJGh0dHAsIG1vbWVudCwgUEVSSU9EUyl7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXREYXRlUmFuZ2VGb3JQZXJpb2Q6IGZ1bmN0aW9uKHBlcmlvZCkge1xuICAgICAgICAgICAgICAgIHZhciBzdGFydERhdGU7XG4gICAgICAgICAgICAgICAgdmFyIGVuZERhdGUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoKHBlcmlvZCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFBFUklPRFMuV0VFSzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0RGF0ZSA9IG1vbWVudCgpLnN1YnRyYWN0KDcsICdkYXlzJykudG9EYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBQRVJJT0RTLlRXT1dFRUs6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydERhdGUgPSBtb21lbnQoKS5zdWJ0cmFjdCgxNCwgJ2RheXMnKS50b0RhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFBFUklPRFMuTU9OVEg6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydERhdGUgPSBtb21lbnQoKS5zdWJ0cmFjdCgxLCAnbW9udGgnKS50b0RhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFBFUklPRFMuUVVBUlRFUjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0RGF0ZSA9IG1vbWVudCgpLnN1YnRyYWN0KDMsICdtb250aHMnKS50b0RhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtzdGFydERhdGU6IHN0YXJ0RGF0ZSwgZW5kRGF0ZTogZW5kRGF0ZX07XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBnZXRXaW5uaW5nUGVyY2VudGFnZXNGb3JEYXRlUmFuZ2U6IGZ1bmN0aW9uKGRhdGVSYW5nZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9hcGkvd2lubmluZ1BlcmNlbnRhZ2VzP3N0YXJ0RGF0ZT0nICsgbW9tZW50KGRhdGVSYW5nZS5zdGFydERhdGUpLmZvcm1hdCgnWVlZWS1NTS1ERCcpICsgJyZlbmREYXRlPScgKyBtb21lbnQoZGF0ZVJhbmdlLmVuZERhdGUpLmZvcm1hdCgnWVlZWS1NTS1ERCcpXG4gICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNyZWF0ZUxlYWRlcmJvYXJkc0Zyb21XaW5uaW5nUGVyY2VudGFnZXM6IGZ1bmN0aW9uKHdpbm5pbmdQZXJjZW50YWdlcykge1xuICAgICAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1QbGF5ZXJTdGF0cyA9IGZ1bmN0aW9uKHBsYXllclN0YXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3aW5QZXJjZW50ID0gTWF0aC5yb3VuZChwbGF5ZXJTdGF0cy53aW5QZXJjZW50ICogMTAwMDApIC8gMTAwO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmV4dGVuZCh7fSwgcGxheWVyU3RhdHMsIHt3aW5QZXJjZW50OiB3aW5QZXJjZW50fSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHNvbG86IHdpbm5pbmdQZXJjZW50YWdlcy5zb2xvW3dpbm5pbmdQZXJjZW50YWdlcy5zb2xvLmxlbmd0aCAtIDFdLnBlcmNlbnRhZ2VzLm1hcCh0cmFuc2Zvcm1QbGF5ZXJTdGF0cyksXG4gICAgICAgICAgICAgICAgICAgIGR1bzogd2lubmluZ1BlcmNlbnRhZ2VzLmR1b1t3aW5uaW5nUGVyY2VudGFnZXMuZHVvLmxlbmd0aCAtIDFdLnBlcmNlbnRhZ2VzLm1hcCh0cmFuc2Zvcm1QbGF5ZXJTdGF0cylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbn0pKCk7Il19
