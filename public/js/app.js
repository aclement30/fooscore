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
        'ngSanitize',
        'angularMoment',
        'md.data.table',
        'chart.js',
        'LocalStorageModule'
    ])
    .constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    })
    .constant('USER_ROLES', {
        all: '*',
        admin: 'admin',
        player: 'player',
        guest: 'guest'
    })
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
        '$httpProvider',
        'USER_ROLES',
        'localStorageServiceProvider',

        function($stateProvider,
                 $urlRouterProvider,
                 $mdThemingProvider,
                 $mdIconProvider,
                 ChartJsProvider,
                 $mdDateLocaleProvider,
                 moment,
                 $httpProvider,
                 USER_ROLES,
                 localStorageServiceProvider) {
            localStorageServiceProvider
                .setPrefix('fooscore');

            $urlRouterProvider.otherwise('/dashboard');

            $stateProvider
                .state('login', {
                    url: '/login',
                    templateUrl: 'views/login.html',
                    controller: 'LoginController',
                    controllerAs: 'ctrl',
                    resolve: {
                        config: function (Config) {
                            return Config.init();
                        }
                    }
                })

                .state('main', {
                    abstract: true,
                    template: '<ui-view/>',
                    resolve: {
                        players: function (PlayerManager) {
                            return PlayerManager.init();
                        },
                        auth: function (AuthResolver) {
                            return AuthResolver.resolve();
                        },
                        config: function (Config) {
                            return Config.init();
                        }
                    }
                })

                .state('dashboard', {
                    url: '/dashboard',
                    templateUrl: 'views/dashboard.html',
                    controller: 'DashboardController',
                    controllerAs: 'ctrl',
                    parent: 'main',
                    data: {
                        //authorizedRoles: [USER_ROLES.admin, USER_ROLES.player],
                        ui: {
                            section: 'dashboard'
                        }
                    }
                })

                .state('stats', {
                    url: '/stats',
                    templateUrl: 'views/stats.html',
                    controller: 'StatsController',
                    controllerAs: 'ctrl',
                    parent: 'main',
                    data: {
                        //authorizedRoles: [USER_ROLES.admin, USER_ROLES.player],
                        ui: {
                            section: 'stats'
                        }
                    }
                })

                .state('add', {
                    url: '/add',
                    templateUrl: 'views/edit-match.html',
                    controller: 'EditMatchController',
                    controllerAs: 'ctrl',
                    parent: 'main',
                    data: {
                        //authorizedRoles: [USER_ROLES.admin, USER_ROLES.player],
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
                    parent: 'main',
                    data: {
                        //authorizedRoles: [USER_ROLES.admin, USER_ROLES.player],
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

            $httpProvider.interceptors.push([
                '$injector',
                function ($injector) {
                    return $injector.get('AuthInterceptor');
                }
            ]);
        }
    ])
    .run([
        '$rootScope',
        'amMoment',
        'Auth',
        'AUTH_EVENTS',
        '$state',

        function ($rootScope, amMoment, Auth, AUTH_EVENTS, $state) {
            amMoment.changeLocale('fr');

            $rootScope.currentPage = {
                requests: {}
            };

            $rootScope.serverIsOnline = true;
            $rootScope.tasks = {};

            $rootScope.$on('$stateChangeStart', function (event, next) {
                var authorizedRoles = next.data && next.data.authorizedRoles;
                if (authorizedRoles && !Auth.isAuthorized(authorizedRoles)) {
                    event.preventDefault();
                    if (Auth.isAuthenticated()) {
                        // user is not allowed
                        $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
                    } else {
                        // user is not logged in
                        $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
                    }
                }

                if (next.name == 'login' && Auth.isAuthenticated()) {
                    event.preventDefault();
                    $state.go('dashboard');
                }
            });

            $rootScope.$on(AUTH_EVENTS.loginFailed, function(event){
                $state.go('login');
            })
        }
    ]);

angular.module('scoreApp.controllers', []);
angular.module('scoreApp.services', []);
angular.module('scoreApp.directives', []);

require('./controllers/AppController');
require('./controllers/DashboardController');
require('./controllers/EditMatchController');
require('./controllers/LoginController');
require('./controllers/MatchController');
require('./controllers/StatsController');

require('./models/Match');
require('./models/Player');
require('./models/User');

require('./services/Auth');
require('./services/AuthInterceptor');
require('./services/AuthResolver');
require('./services/Config');
require('./services/PlayerManager');
require('./services/Statistic');
},{"./controllers/AppController":2,"./controllers/DashboardController":3,"./controllers/EditMatchController":4,"./controllers/LoginController":5,"./controllers/MatchController":6,"./controllers/StatsController":7,"./models/Match":8,"./models/Player":9,"./models/User":10,"./services/Auth":11,"./services/AuthInterceptor":12,"./services/AuthResolver":13,"./services/Config":14,"./services/PlayerManager":15,"./services/Statistic":16}],2:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.controllers')
        .controller('AppController', AppController);

    function AppController ($mdSidenav, $rootScope, Auth, $scope, $state, USER_ROLES) {
        var self = this;

        var _defaultUI = {
            section: null,
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
        self.logout = logout;

        $scope.userRoles = USER_ROLES;
        $scope.isAuthorized = Auth.isAuthorized;

        function toggleMenu() {
            $mdSidenav('left').toggle();
        }

        function closeMenu() {
            $mdSidenav('left').close();
        }

        function logout() {
            Auth.logout(function(){
                $scope.setCurrentUser(null);
            });

            $state.go('login');
        }

        Auth.login(function() {
            $scope.setCurrentUser(Auth.user);
        });

        $scope.setCurrentUser = function (user) {
            $rootScope.currentUser = user;
        };
    }
})();
},{}],3:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.controllers')
        .controller('DashboardController', DashboardController);

    function DashboardController (Match, $mdMedia, $mdDialog, $scope, PlayerManager) {
        var self = this;

        self.matches = {};
        self.loadingPromise = {};
        self.totalCount = 0;
        self.playerNames = PlayerManager.names;
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

    /**
     * Convert ISOString date to Date object
     * @param {string} dateString
     * @returns {Date}
     */
    function convertDate(dateString) {
        var a;

        if (typeof dateString === 'string') {
            a = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);
            if (a) {
                return new Date(+a[1], +a[2] - 1, +a[3]);
            }
        }
    }

    function EditMatchController (Match, PlayerManager, $mdToast, $mdDialog, $stateParams, $state){
        var self = this;

        self.players = [];
        angular.forEach(PlayerManager.players, function(player) {
            self.players.push(player);
        });

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
                match.date = convertDate(match.date);
                match.team1.players = match.team1.players.map(function(playerId){ return PlayerManager.players[playerId] });
                match.team2.players = match.team2.players.map(function(playerId){ return PlayerManager.players[playerId] });
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
                return (angular.lowercase(player.name).indexOf(lowercaseQuery) === 0);
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
                match = angular.extend({}, self.match);

                match.team1 = angular.extend({}, match.team1);
                match.team2 = angular.extend({}, match.team2);

                match.team1.players = match.team1.players.map(function(player){ return player._id });
                match.team2.players = match.team2.players.map(function(player){ return player._id });

                Match.update(match, successCallback, errorCallback);
            } else {
                match = new Match(angular.extend({}, self.match));

                match.team1 = angular.extend({}, match.team1);
                match.team2 = angular.extend({}, match.team2);

                match.team1.players = match.team1.players.map(function(player){ return player._id });
                match.team2.players = match.team2.players.map(function(player){ return player._id });

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
        .controller('LoginController', LoginController);

    function LoginController (config, $mdDialog, $location, $sce) {
        var self = this;

        self.groupName = config.group.name;

        var queryStringValue = function (field) {
            var href = window.location.href;
            var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
            var string = reg.exec(href);
            return string ? string[1] : null;
        };

        var authError = queryStringValue('error');

        if (authError) {
            var authErrorMessage;
            switch(authError) {
                case 'unauthorized-email-domain':
                    authErrorMessage = "Ce compte Google ne fait pas partie <br>des domaines autorisés pour " + config.group.name + ".";
                    break;
                default:
                    authErrorMessage = "Erreur inconnue lors de l'authentification via Google";
                    break;
            }

            $mdDialog.show(
                $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('Erreur')
                    .htmlContent($sce.trustAsHtml(authErrorMessage))
                    .ok('OK')
            );
        }
    }
})();
},{}],6:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.controllers')
        .controller('MatchController', MatchController);

    function MatchController (Match, matchId, $mdDialog, $state, PlayerManager) {
        var self = this;

        self.match = {};
        self.playerNames = PlayerManager.names;
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
},{}],7:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.controllers')
        .controller('StatsController', StatsController);

    function StatsController (PlayerManager, Statistic, moment, PERIODS){
        var self = this;

        self.playerColors = PlayerManager.colors;
        self.playerNames = PlayerManager.names;
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
            var series = {},
                count = 1;

            angular.forEach(playerPercentages, function (dayStats) {
                angular.forEach(dayStats.percentages, function (playerStats, index) {
                    if (!series[playerStats.player]) {
                        series[playerStats.player] = [];
                    }

                    series[playerStats.player].push(Math.round(playerStats.winPercent * 10000) / 100);
                });

                angular.forEach(PlayerManager.players, function(player, id){
                    if (!series[id]) {
                        series[id] = [];
                    }

                    if (series[id].length < count) {
                        series[id].push(null);
                    }
                });

                count++;
            });

            return series;
        }

        function createChartData(playerPercentages) {
            var series = createChartSeries(playerPercentages);

            var getPlayerName = function(id) {
                return self.playerNames[id];
            };

            return {
                series: Object.keys(series).map(getPlayerName),
                data: extractSeriesData(series),
                colors: getColorsForSeries(series),
                labels: createLabelsForInterval(_dateRange.startDate, _dateRange.endDate)
            };
        }

        function extractSeriesData(series) {
            var data = [];

            angular.forEach(series, function (serie) {
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
},{}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.services')
        .factory('Player', Player);

    function Player ($resource){
        return $resource('/api/players', {}, {
            query: {
                method: 'GET',
                isArray: false
            }
        });
    }
})();
},{}],10:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.services')
        .factory('User', User);

    function User ($resource){
        return $resource('/api/user', {}, {
            query: {
                method: 'GET',
                isArray: false
            }
        });
    }
})();
},{}],11:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.services')
        .factory('Auth', AuthService);

    function AuthService($rootScope, $http, AUTH_EVENTS, localStorageService) {
        var AuthService = {
            user: null,
            authenticated: false
        };

        // Retrieve user auth details from local storage
        if (localStorageService.isSupported) {
            var user = localStorageService.get('user');
            if (user) {
                AuthService.user = user;
                AuthService.authenticated = true;
            }
        }

        AuthService.login = function(callback) {
            $http({ method: 'GET', url: '/api/user' })

                // User successfully authenticates
                .success(function(data, status, headers, config) {
                    AuthService.authenticated = true;
                    AuthService.user = data;

                    // Store user auth details in local storage
                    if (localStorageService.isSupported) {
                        localStorageService.set('user', data);
                    }

                    $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);

                    if (typeof(callback) === typeof(Function)) callback();
                })

                // Not logged in
                .error(function(data, status, headers, config) {
                    AuthService.authenticated = false;
                    AuthService.user = null;

                    if (localStorageService.isSupported) {
                        localStorageService.remove('user');
                    }

                    if (typeof(callback) === typeof(Function)) callback();

                    $rootScope.$broadcast(AUTH_EVENTS.loginFailed);

                    if (typeof(callback) === typeof(Function)) callback();
                });
        };

        AuthService.logout = function(callback) {
            AuthService.authenticated = false;
            AuthService.user = null;

            $http({ method: 'GET', url: '/logout' })

            // User successfully logged out
                .success(function(data, status, headers, config) {
                    if (localStorageService.isSupported) {
                        localStorageService.remove('user');
                    }

                    if (typeof(callback) === typeof(Function)) callback();
                })

                // Sign out error
                .error(function(data, status, headers, config) {
                    if (typeof(callback) === typeof(Function)) callback();
                });
        };

        AuthService.isAuthenticated = function () {
            return AuthService.authenticated;
        };

        AuthService.isAuthorized = function (authorizedRoles) {
            if (!angular.isArray(authorizedRoles)) {
                authorizedRoles = [authorizedRoles];
            }
            return (AuthService.authenticated && authorizedRoles.indexOf(AuthService.user.role) !== -1);
        };

        return AuthService;
    }
})();
},{}],12:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.services')
        .factory('AuthInterceptor', AuthInterceptor);

    function AuthInterceptor($rootScope, $q, AUTH_EVENTS) {
        return {
            responseError: function (response) {
                $rootScope.$broadcast({
                    401: AUTH_EVENTS.notAuthenticated,
                    403: AUTH_EVENTS.notAuthorized,
                    419: AUTH_EVENTS.sessionTimeout,
                    440: AUTH_EVENTS.sessionTimeout
                }[response.status], response);
                return $q.reject(response);
            }
        };
    }
})();
},{}],13:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.services')
        .factory('AuthResolver', AuthResolver);

    function AuthResolver($q, $rootScope, $state) {
        return {
            resolve: function () {
                var deferred = $q.defer();
                var unwatch = $rootScope.$watch('currentUser', function (currentUser) {
                    if (angular.isDefined(currentUser)) {
                        if (currentUser) {
                            deferred.resolve(currentUser);
                        } else {
                            deferred.reject();
                            $state.go('login');
                        }

                        unwatch();
                    }
                });
                return deferred.promise;
            }
        };
    }
})();
},{}],14:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.services')
        .factory('Config', Config);

    function Config ($http, $q) {
        var Config = {
            app: null
        };

        Config.init = function() {
            if (Config.app) {
                return Config.app;
            } else {
                var promise = $q.defer();

                $http({method: 'GET', url: '/api/config'}).then(function(response) {
                    Config.app = response.data;

                    promise.resolve(Config.app);
                }, function(err) {
                    promise.reject(err);
                });

                return promise.promise;
            }
        };

        return Config;
    }
})();
},{}],15:[function(require,module,exports){
(function () {
    'use strict';
    angular
        .module('scoreApp.services')
        .factory('PlayerManager', PlayerManager);

    function PlayerManager (Player){
        var colors = [
            '#304ffe',
            '#aa00ff',
            '#d50000',
            '#0091ea',
            '#00c853',
            '#aeea00',
            '#ff6d00',
            '#5d4037',
            'cyan',
            'purple'
        ];

        var PlayerManager = {};

        PlayerManager.players = {};
        PlayerManager.names = {};
        PlayerManager.colors = {};

        PlayerManager.init = function() {
            var promise = Player.query().$promise;

            promise.then(function(objects){
                var i = 0;

                angular.forEach(objects, function(player, id){
                    if (id != '$promise' && id != '$resolved') {
                        player.color = colors[i];

                        PlayerManager.players[id] = player;
                        PlayerManager.names[id] = player.name;
                        PlayerManager.colors[id] = player.color;

                        i++;
                    }
                });
            });

            return promise;
        };

        return PlayerManager;
    }
})();
},{}],16:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvYXBwIiwic3JjL2pzL2NvbnRyb2xsZXJzL0FwcENvbnRyb2xsZXIuanMiLCJzcmMvanMvY29udHJvbGxlcnMvRGFzaGJvYXJkQ29udHJvbGxlci5qcyIsInNyYy9qcy9jb250cm9sbGVycy9FZGl0TWF0Y2hDb250cm9sbGVyLmpzIiwic3JjL2pzL2NvbnRyb2xsZXJzL0xvZ2luQ29udHJvbGxlci5qcyIsInNyYy9qcy9jb250cm9sbGVycy9NYXRjaENvbnRyb2xsZXIuanMiLCJzcmMvanMvY29udHJvbGxlcnMvU3RhdHNDb250cm9sbGVyLmpzIiwic3JjL2pzL21vZGVscy9NYXRjaC5qcyIsInNyYy9qcy9tb2RlbHMvUGxheWVyLmpzIiwic3JjL2pzL21vZGVscy9Vc2VyLmpzIiwic3JjL2pzL3NlcnZpY2VzL0F1dGguanMiLCJzcmMvanMvc2VydmljZXMvQXV0aEludGVyY2VwdG9yLmpzIiwic3JjL2pzL3NlcnZpY2VzL0F1dGhSZXNvbHZlci5qcyIsInNyYy9qcy9zZXJ2aWNlcy9Db25maWcuanMiLCJzcmMvanMvc2VydmljZXMvUGxheWVyTWFuYWdlci5qcyIsInNyYy9qcy9zZXJ2aWNlcy9TdGF0aXN0aWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBEZWNsYXJlIGFwcCBsZXZlbCBtb2R1bGUgd2hpY2ggZGVwZW5kcyBvbiBmaWx0ZXJzLCBhbmQgc2VydmljZXNcbmFuZ3VsYXIubW9kdWxlKCdzY29yZUFwcCcsIFtcbiAgICAgICAgJ3Njb3JlQXBwLmNvbnRyb2xsZXJzJyxcbiAgICAgICAgJ3Njb3JlQXBwLnNlcnZpY2VzJyxcbiAgICAgICAgJ3Njb3JlQXBwLmRpcmVjdGl2ZXMnLFxuICAgICAgICAndWkucm91dGVyJyxcbiAgICAgICAgJ25nTWF0ZXJpYWwnLFxuICAgICAgICAnbmdSZXNvdXJjZScsXG4gICAgICAgICduZ01lc3NhZ2VzJyxcbiAgICAgICAgJ25nU2FuaXRpemUnLFxuICAgICAgICAnYW5ndWxhck1vbWVudCcsXG4gICAgICAgICdtZC5kYXRhLnRhYmxlJyxcbiAgICAgICAgJ2NoYXJ0LmpzJyxcbiAgICAgICAgJ0xvY2FsU3RvcmFnZU1vZHVsZSdcbiAgICBdKVxuICAgIC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pXG4gICAgLmNvbnN0YW50KCdVU0VSX1JPTEVTJywge1xuICAgICAgICBhbGw6ICcqJyxcbiAgICAgICAgYWRtaW46ICdhZG1pbicsXG4gICAgICAgIHBsYXllcjogJ3BsYXllcicsXG4gICAgICAgIGd1ZXN0OiAnZ3Vlc3QnXG4gICAgfSlcbiAgICAuY29uc3RhbnQoJ1BFUklPRFMnLCB7XG4gICAgICAgICdXRUVLJzogJzdEJyxcbiAgICAgICAgJ1RXT1dFRUsnOiAnMTREJyxcbiAgICAgICAgJ01PTlRIJzogJzMwRCcsXG4gICAgICAgICdRVUFSVEVSJzogJzNNJ1xuICAgIH0pXG4gICAgLmNvbmZpZyhbXG4gICAgICAgICckc3RhdGVQcm92aWRlcicsXG4gICAgICAgICckdXJsUm91dGVyUHJvdmlkZXInLFxuICAgICAgICAnJG1kVGhlbWluZ1Byb3ZpZGVyJyxcbiAgICAgICAgJyRtZEljb25Qcm92aWRlcicsXG4gICAgICAgICdDaGFydEpzUHJvdmlkZXInLFxuICAgICAgICAnJG1kRGF0ZUxvY2FsZVByb3ZpZGVyJyxcbiAgICAgICAgJ21vbWVudCcsXG4gICAgICAgICckaHR0cFByb3ZpZGVyJyxcbiAgICAgICAgJ1VTRVJfUk9MRVMnLFxuICAgICAgICAnbG9jYWxTdG9yYWdlU2VydmljZVByb3ZpZGVyJyxcblxuICAgICAgICBmdW5jdGlvbigkc3RhdGVQcm92aWRlcixcbiAgICAgICAgICAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLFxuICAgICAgICAgICAgICAgICAkbWRUaGVtaW5nUHJvdmlkZXIsXG4gICAgICAgICAgICAgICAgICRtZEljb25Qcm92aWRlcixcbiAgICAgICAgICAgICAgICAgQ2hhcnRKc1Byb3ZpZGVyLFxuICAgICAgICAgICAgICAgICAkbWREYXRlTG9jYWxlUHJvdmlkZXIsXG4gICAgICAgICAgICAgICAgIG1vbWVudCxcbiAgICAgICAgICAgICAgICAgJGh0dHBQcm92aWRlcixcbiAgICAgICAgICAgICAgICAgVVNFUl9ST0xFUyxcbiAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlU2VydmljZVByb3ZpZGVyKSB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2VTZXJ2aWNlUHJvdmlkZXJcbiAgICAgICAgICAgICAgICAuc2V0UHJlZml4KCdmb29zY29yZScpO1xuXG4gICAgICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvZGFzaGJvYXJkJyk7XG5cbiAgICAgICAgICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9sb2dpbi5odG1sJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWc6IGZ1bmN0aW9uIChDb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gQ29uZmlnLmluaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ21haW4nLCB7XG4gICAgICAgICAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJzx1aS12aWV3Lz4nLFxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGF5ZXJzOiBmdW5jdGlvbiAoUGxheWVyTWFuYWdlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBQbGF5ZXJNYW5hZ2VyLmluaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRoOiBmdW5jdGlvbiAoQXV0aFJlc29sdmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhSZXNvbHZlci5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnOiBmdW5jdGlvbiAoQ29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIENvbmZpZy5pbml0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdkYXNoYm9hcmQnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9kYXNoYm9hcmQnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2Rhc2hib2FyZC5odG1sJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0Rhc2hib2FyZENvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICdjdHJsJyxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50OiAnbWFpbicsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vYXV0aG9yaXplZFJvbGVzOiBbVVNFUl9ST0xFUy5hZG1pbiwgVVNFUl9ST0xFUy5wbGF5ZXJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgdWk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWN0aW9uOiAnZGFzaGJvYXJkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnc3RhdHMnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9zdGF0cycsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvc3RhdHMuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTdGF0c0NvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICdjdHJsJyxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50OiAnbWFpbicsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vYXV0aG9yaXplZFJvbGVzOiBbVVNFUl9ST0xFUy5hZG1pbiwgVVNFUl9ST0xFUy5wbGF5ZXJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgdWk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWN0aW9uOiAnc3RhdHMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhZGQnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9hZGQnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2VkaXQtbWF0Y2guaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdFZGl0TWF0Y2hDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiAnY3RybCcsXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogJ21haW4nLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2F1dGhvcml6ZWRSb2xlczogW1VTRVJfUk9MRVMuYWRtaW4sIFVTRVJfUk9MRVMucGxheWVyXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVpOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQnV0dG9uOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrQnV0dG9uOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdlZGl0Jywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvZWRpdC86bWF0Y2hJZCcsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvZWRpdC1tYXRjaC5odG1sJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0VkaXRNYXRjaENvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICdjdHJsJyxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50OiAnbWFpbicsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vYXV0aG9yaXplZFJvbGVzOiBbVVNFUl9ST0xFUy5hZG1pbiwgVVNFUl9ST0xFUy5wbGF5ZXJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgdWk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRCdXR0b246IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tCdXR0b246IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAkbWRJY29uUHJvdmlkZXJcbiAgICAgICAgICAgICAgICAuZGVmYXVsdEZvbnRTZXQoJ21hdGVyaWFsLWljb25zJyk7XG5cbiAgICAgICAgICAgICRtZFRoZW1pbmdQcm92aWRlci50aGVtZSgnZGVmYXVsdCcpXG4gICAgICAgICAgICAgICAgLnByaW1hcnlQYWxldHRlKCd0ZWFsJylcbiAgICAgICAgICAgICAgICAuYWNjZW50UGFsZXR0ZSgnbGltZScpXG4gICAgICAgICAgICAgICAgLndhcm5QYWxldHRlKCdkZWVwLW9yYW5nZScpXG4gICAgICAgICAgICAgICAgLmJhY2tncm91bmRQYWxldHRlKCdncmV5Jyk7XG5cbiAgICAgICAgICAgIENoYXJ0SnNQcm92aWRlci5zZXRPcHRpb25zKCdMaW5lJywge1xuICAgICAgICAgICAgICAgIHNjYWxlU2hvd1ZlcnRpY2FsTGluZXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1haW50YWluQXNwZWN0UmF0aW86IGZhbHNlLFxuICAgICAgICAgICAgICAgIGRhdGFzZXRGaWxsOiBmYWxzZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICRtZERhdGVMb2NhbGVQcm92aWRlci5tb250aHMgPSBbJ2phbnZpZXInLCAnZsOpdnJpZXInLCAnbWFycycsICdhdnJpbCcsICdtYWknLCAnanVpbicsICdqdWlsbGV0JywgJ2Fvw7t0JywgJ3NlcHRlbWJyZScsICdvY3RvYnJlJywgJ25vdmVtYnJlJywgJ2TDqWNlbWJyZSddO1xuICAgICAgICAgICAgJG1kRGF0ZUxvY2FsZVByb3ZpZGVyLnNob3J0TW9udGhzID0gWydqYW52LicsICdmw6l2ci4nLCAnbWFycycsICdhdnJpbCcsICdtYWknLCAnanVpbicsICdqdWlsLicsICdhb8O7dCcsICdzZXB0LicsICdvY3QuJywgJ25vdi4nLCAnZMOpYy4nXTtcbiAgICAgICAgICAgICRtZERhdGVMb2NhbGVQcm92aWRlci5kYXlzID0gWydkaW1hbmNoZScsICdsdW5kaScsICdtYXJkaScsICdtZXJjcmVkaScsICdqZXVkaScsICd2ZW5kcmVkaScsICdzYW1lZGknXTtcbiAgICAgICAgICAgICRtZERhdGVMb2NhbGVQcm92aWRlci5zaG9ydERheXMgPSBbJ0RpJywgJ0x1JywgJ01hJywgJ01lJywgJ0plJywgJ1ZlJywgJ1NhJ107XG4gICAgICAgICAgICAkbWREYXRlTG9jYWxlUHJvdmlkZXIuZmlyc3REYXlPZldlZWsgPSAxO1xuICAgICAgICAgICAgJG1kRGF0ZUxvY2FsZVByb3ZpZGVyLmZvcm1hdERhdGUgPSBmdW5jdGlvbihkYXRlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vbWVudChkYXRlKS5mb3JtYXQoJ0RELk1NLllZWVknKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAkbWREYXRlTG9jYWxlUHJvdmlkZXIubXNnQ2FsZW5kYXIgPSAnQ2FsZW5kcmllcic7XG4gICAgICAgICAgICAkbWREYXRlTG9jYWxlUHJvdmlkZXIubXNnT3BlbkNhbGVuZGFyID0gJ091dnJpciBsZSBjYWxlbmRyaWVyJztcblxuICAgICAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH1cbiAgICBdKVxuICAgIC5ydW4oW1xuICAgICAgICAnJHJvb3RTY29wZScsXG4gICAgICAgICdhbU1vbWVudCcsXG4gICAgICAgICdBdXRoJyxcbiAgICAgICAgJ0FVVEhfRVZFTlRTJyxcbiAgICAgICAgJyRzdGF0ZScsXG5cbiAgICAgICAgZnVuY3Rpb24gKCRyb290U2NvcGUsIGFtTW9tZW50LCBBdXRoLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG4gICAgICAgICAgICBhbU1vbWVudC5jaGFuZ2VMb2NhbGUoJ2ZyJyk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFBhZ2UgPSB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdHM6IHt9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLnNlcnZlcklzT25saW5lID0gdHJ1ZTtcbiAgICAgICAgICAgICRyb290U2NvcGUudGFza3MgPSB7fTtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCBuZXh0KSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1dGhvcml6ZWRSb2xlcyA9IG5leHQuZGF0YSAmJiBuZXh0LmRhdGEuYXV0aG9yaXplZFJvbGVzO1xuICAgICAgICAgICAgICAgIGlmIChhdXRob3JpemVkUm9sZXMgJiYgIUF1dGguaXNBdXRob3JpemVkKGF1dGhvcml6ZWRSb2xlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEF1dGguaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVzZXIgaXMgbm90IGFsbG93ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVzZXIgaXMgbm90IGxvZ2dlZCBpblxuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG5leHQubmFtZSA9PSAnbG9naW4nICYmIEF1dGguaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdkYXNoYm9hcmQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5GYWlsZWQsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgXSk7XG5cbmFuZ3VsYXIubW9kdWxlKCdzY29yZUFwcC5jb250cm9sbGVycycsIFtdKTtcbmFuZ3VsYXIubW9kdWxlKCdzY29yZUFwcC5zZXJ2aWNlcycsIFtdKTtcbmFuZ3VsYXIubW9kdWxlKCdzY29yZUFwcC5kaXJlY3RpdmVzJywgW10pO1xuXG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL0FwcENvbnRyb2xsZXInKTtcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvRGFzaGJvYXJkQ29udHJvbGxlcicpO1xucmVxdWlyZSgnLi9jb250cm9sbGVycy9FZGl0TWF0Y2hDb250cm9sbGVyJyk7XG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL0xvZ2luQ29udHJvbGxlcicpO1xucmVxdWlyZSgnLi9jb250cm9sbGVycy9NYXRjaENvbnRyb2xsZXInKTtcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvU3RhdHNDb250cm9sbGVyJyk7XG5cbnJlcXVpcmUoJy4vbW9kZWxzL01hdGNoJyk7XG5yZXF1aXJlKCcuL21vZGVscy9QbGF5ZXInKTtcbnJlcXVpcmUoJy4vbW9kZWxzL1VzZXInKTtcblxucmVxdWlyZSgnLi9zZXJ2aWNlcy9BdXRoJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2VzL0F1dGhJbnRlcmNlcHRvcicpO1xucmVxdWlyZSgnLi9zZXJ2aWNlcy9BdXRoUmVzb2x2ZXInKTtcbnJlcXVpcmUoJy4vc2VydmljZXMvQ29uZmlnJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2VzL1BsYXllck1hbmFnZXInKTtcbnJlcXVpcmUoJy4vc2VydmljZXMvU3RhdGlzdGljJyk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5jb250cm9sbGVycycpXG4gICAgICAgIC5jb250cm9sbGVyKCdBcHBDb250cm9sbGVyJywgQXBwQ29udHJvbGxlcik7XG5cbiAgICBmdW5jdGlvbiBBcHBDb250cm9sbGVyICgkbWRTaWRlbmF2LCAkcm9vdFNjb3BlLCBBdXRoLCAkc2NvcGUsICRzdGF0ZSwgVVNFUl9ST0xFUykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdmFyIF9kZWZhdWx0VUkgPSB7XG4gICAgICAgICAgICBzZWN0aW9uOiBudWxsLFxuICAgICAgICAgICAgYWRkQnV0dG9uOiB0cnVlLFxuICAgICAgICAgICAgYmFja0J1dHRvbjogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYudWkgPSBhbmd1bGFyLmV4dGVuZCh7fSwgX2RlZmF1bHRVSSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUpe1xuICAgICAgICAgICAgaWYgKHRvU3RhdGUuZGF0YSkge1xuICAgICAgICAgICAgICAgIHNlbGYudWkgPSBhbmd1bGFyLmV4dGVuZCh7fSwgX2RlZmF1bHRVSSwgdG9TdGF0ZS5kYXRhLnVpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi51aSA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCBfZGVmYXVsdFVJKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2VsZi5jbG9zZU1lbnUgPSBjbG9zZU1lbnU7XG4gICAgICAgIHNlbGYudG9nZ2xlTWVudSA9IHRvZ2dsZU1lbnU7XG4gICAgICAgIHNlbGYubG9nb3V0ID0gbG9nb3V0O1xuXG4gICAgICAgICRzY29wZS51c2VyUm9sZXMgPSBVU0VSX1JPTEVTO1xuICAgICAgICAkc2NvcGUuaXNBdXRob3JpemVkID0gQXV0aC5pc0F1dGhvcml6ZWQ7XG5cbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlTWVudSgpIHtcbiAgICAgICAgICAgICRtZFNpZGVuYXYoJ2xlZnQnKS50b2dnbGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNsb3NlTWVudSgpIHtcbiAgICAgICAgICAgICRtZFNpZGVuYXYoJ2xlZnQnKS5jbG9zZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gbG9nb3V0KCkge1xuICAgICAgICAgICAgQXV0aC5sb2dvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2V0Q3VycmVudFVzZXIobnVsbCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICB9XG5cbiAgICAgICAgQXV0aC5sb2dpbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRDdXJyZW50VXNlcihBdXRoLnVzZXIpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuc2V0Q3VycmVudFVzZXIgPSBmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IHVzZXI7XG4gICAgICAgIH07XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ3Njb3JlQXBwLmNvbnRyb2xsZXJzJylcbiAgICAgICAgLmNvbnRyb2xsZXIoJ0Rhc2hib2FyZENvbnRyb2xsZXInLCBEYXNoYm9hcmRDb250cm9sbGVyKTtcblxuICAgIGZ1bmN0aW9uIERhc2hib2FyZENvbnRyb2xsZXIgKE1hdGNoLCAkbWRNZWRpYSwgJG1kRGlhbG9nLCAkc2NvcGUsIFBsYXllck1hbmFnZXIpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYubWF0Y2hlcyA9IHt9O1xuICAgICAgICBzZWxmLmxvYWRpbmdQcm9taXNlID0ge307XG4gICAgICAgIHNlbGYudG90YWxDb3VudCA9IDA7XG4gICAgICAgIHNlbGYucGxheWVyTmFtZXMgPSBQbGF5ZXJNYW5hZ2VyLm5hbWVzO1xuICAgICAgICBzZWxmLmdldE1hdGNoZXMgPSBnZXRNYXRjaGVzO1xuICAgICAgICBzZWxmLnNob3dNYXRjaERldGFpbCA9IHNob3dNYXRjaERldGFpbDtcbiAgICAgICAgc2VsZi5mdWxsc2NyZWVuTW9kYWwgPSAkbWRNZWRpYSgneHMnKTtcblxuICAgICAgICBzZWxmLnF1ZXJ5ID0ge1xuICAgICAgICAgICAgbGltaXQ6IDIwLFxuICAgICAgICAgICAgcGFnZTogMVxuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIGdldE1hdGNoZXMoKSB7XG4gICAgICAgICAgICBzZWxmLmxvYWRpbmdQcm9taXNlID0gTWF0Y2gucXVlcnkoc2VsZi5xdWVyeSkuJHByb21pc2U7XG5cbiAgICAgICAgICAgIHNlbGYubG9hZGluZ1Byb21pc2UudGhlbihmdW5jdGlvbihtYXRjaGVzKXtcbiAgICAgICAgICAgICAgICBzZWxmLm1hdGNoZXMgPSBtYXRjaGVzO1xuICAgICAgICAgICAgICAgIHNlbGYudG90YWxDb3VudCA9IE1hdGNoLnRvdGFsQ291bnQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNob3dNYXRjaERldGFpbChtYXRjaElkLCBldikge1xuICAgICAgICAgICAgdmFyIHVzZUZ1bGxTY3JlZW4gPSAkbWRNZWRpYSgneHMnKSAmJiBzZWxmLmZ1bGxzY3JlZW5Nb2RhbDtcblxuICAgICAgICAgICAgJG1kRGlhbG9nLnNob3coe1xuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnTWF0Y2hDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiAnY3RybCcsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbWF0Y2guaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmJvZHkpLFxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRFdmVudDogZXYsXG4gICAgICAgICAgICAgICAgICAgIGNsaWNrT3V0c2lkZVRvQ2xvc2U6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGZ1bGxzY3JlZW46IHVzZUZ1bGxTY3JlZW4sXG4gICAgICAgICAgICAgICAgICAgIGxvY2Fsczoge21hdGNoSWQ6IG1hdGNoSWR9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRtZE1lZGlhKCd4cycpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24od2FudHNGdWxsU2NyZWVuKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5mdWxsc2NyZWVuTW9kYWwgPSAod2FudHNGdWxsU2NyZWVuID09PSB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0TWF0Y2hlcygpO1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5jb250cm9sbGVycycpXG4gICAgICAgIC5jb250cm9sbGVyKCdFZGl0TWF0Y2hDb250cm9sbGVyJywgRWRpdE1hdGNoQ29udHJvbGxlcik7XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IElTT1N0cmluZyBkYXRlIHRvIERhdGUgb2JqZWN0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGVTdHJpbmdcbiAgICAgKiBAcmV0dXJucyB7RGF0ZX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb252ZXJ0RGF0ZShkYXRlU3RyaW5nKSB7XG4gICAgICAgIHZhciBhO1xuXG4gICAgICAgIGlmICh0eXBlb2YgZGF0ZVN0cmluZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGEgPSAvXihcXGR7NH0pLShcXGR7Mn0pLShcXGR7Mn0pLy5leGVjKGRhdGVTdHJpbmcpO1xuICAgICAgICAgICAgaWYgKGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoK2FbMV0sICthWzJdIC0gMSwgK2FbM10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gRWRpdE1hdGNoQ29udHJvbGxlciAoTWF0Y2gsIFBsYXllck1hbmFnZXIsICRtZFRvYXN0LCAkbWREaWFsb2csICRzdGF0ZVBhcmFtcywgJHN0YXRlKXtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYucGxheWVycyA9IFtdO1xuICAgICAgICBhbmd1bGFyLmZvckVhY2goUGxheWVyTWFuYWdlci5wbGF5ZXJzLCBmdW5jdGlvbihwbGF5ZXIpIHtcbiAgICAgICAgICAgIHNlbGYucGxheWVycy5wdXNoKHBsYXllcik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNlbGYubWF0Y2ggPSB7XG4gICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgdGVhbTE6IHtcbiAgICAgICAgICAgICAgICBwbGF5ZXJzOiBbXG4gICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG51bGxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIHBvaW50czogbnVsbFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlYW0yOiB7XG4gICAgICAgICAgICAgICAgcGxheWVyczogW1xuICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICBudWxsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBwb2ludHM6IG51bGxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxsczogMSxcbiAgICAgICAgICAgIGNvbW1lbnRzOiBudWxsXG4gICAgICAgIH07XG4gICAgICAgIHNlbGYucXVlcnlTZWFyY2ggPSBxdWVyeVNlYXJjaDtcbiAgICAgICAgc2VsZi5lZGl0TW9kZSA9IGZhbHNlO1xuICAgICAgICBzZWxmLmlzU2F2aW5nID0gZmFsc2U7XG4gICAgICAgIHNlbGYuc2VsZWN0UGxheWVyID0gc2VsZWN0UGxheWVyO1xuICAgICAgICBzZWxmLnNhdmUgPSBzYXZlO1xuICAgICAgICBzZWxmLnJlbW92ZU1hdGNoID0gcmVtb3ZlTWF0Y2g7XG5cbiAgICAgICAgaWYgKCRzdGF0ZVBhcmFtcy5tYXRjaElkKSB7XG4gICAgICAgICAgICBNYXRjaC5nZXQoe2lkOiAkc3RhdGVQYXJhbXMubWF0Y2hJZH0sIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2guZGF0ZSA9IGNvbnZlcnREYXRlKG1hdGNoLmRhdGUpO1xuICAgICAgICAgICAgICAgIG1hdGNoLnRlYW0xLnBsYXllcnMgPSBtYXRjaC50ZWFtMS5wbGF5ZXJzLm1hcChmdW5jdGlvbihwbGF5ZXJJZCl7IHJldHVybiBQbGF5ZXJNYW5hZ2VyLnBsYXllcnNbcGxheWVySWRdIH0pO1xuICAgICAgICAgICAgICAgIG1hdGNoLnRlYW0yLnBsYXllcnMgPSBtYXRjaC50ZWFtMi5wbGF5ZXJzLm1hcChmdW5jdGlvbihwbGF5ZXJJZCl7IHJldHVybiBQbGF5ZXJNYW5hZ2VyLnBsYXllcnNbcGxheWVySWRdIH0pO1xuICAgICAgICAgICAgICAgIHNlbGYubWF0Y2ggPSBtYXRjaDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBzZWxmLmVkaXRNb2RlID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNlbGVjdFBsYXllcih0ZWFtLCBwbGF5ZXJJbmRleCwgcGxheWVyKSB7XG4gICAgICAgICAgICBzZWxmLm1hdGNoRm9ybS50ZWFtMVBsYXllcjIuJHNldFZhbGlkaXR5KFwidW5pcXVlVGVhbVBsYXllclwiLCB2YWxpZGF0ZVRlYW1QbGF5ZXIoc2VsZi5tYXRjaC50ZWFtMSkpO1xuICAgICAgICAgICAgc2VsZi5tYXRjaEZvcm0udGVhbTJQbGF5ZXIyLiRzZXRWYWxpZGl0eShcInVuaXF1ZVRlYW1QbGF5ZXJcIiwgdmFsaWRhdGVUZWFtUGxheWVyKHNlbGYubWF0Y2gudGVhbTIpKTtcblxuICAgICAgICAgICAgc2VsZi5tYXRjaEZvcm0udGVhbTJQbGF5ZXIxLiRzZXRWYWxpZGl0eShcInVuaXF1ZVBsYXllclwiLCB2YWxpZGF0ZVVuaXF1ZVBsYXllcihzZWxmLm1hdGNoLnRlYW0yLCAwKSk7XG4gICAgICAgICAgICBzZWxmLm1hdGNoRm9ybS50ZWFtMlBsYXllcjIuJHNldFZhbGlkaXR5KFwidW5pcXVlUGxheWVyXCIsIHZhbGlkYXRlVW5pcXVlUGxheWVyKHNlbGYubWF0Y2gudGVhbTIsIDEpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHF1ZXJ5U2VhcmNoKHF1ZXJ5LCBjdXJyZW50U2VsZWN0aW9uKSB7XG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWRQbGF5ZXJzID0gW10uY29uY2F0KHNlbGYubWF0Y2gudGVhbTEucGxheWVycywgc2VsZi5tYXRjaC50ZWFtMi5wbGF5ZXJzKTtcblxuICAgICAgICAgICAgLy8gUmVtb3ZlIGN1cnJlbnQgc2VsZWN0aW9uIGZyb20gc2VsZWN0ZWQgcGxheWVyc1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRTZWxlY3Rpb24gJiYgc2VsZWN0ZWRQbGF5ZXJzLmluZGV4T2YoY3VycmVudFNlbGVjdGlvbikgPiAtMSkge1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkUGxheWVycy5zcGxpY2Uoc2VsZWN0ZWRQbGF5ZXJzLmluZGV4T2YoY3VycmVudFNlbGVjdGlvbiksIDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYXZhaWxhYmxlUGxheWVycyA9IHF1ZXJ5ID8gc2VsZi5wbGF5ZXJzLmZpbHRlciggY3JlYXRlRmlsdGVyRm9yKHF1ZXJ5KSApIDogW10uY29uY2F0KHNlbGYucGxheWVycyk7XG5cbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbHJlYWR5IHNlbGVjdGVkIHBsYXllcnMgZnJvbSBhdmFpbGFibGUgcGxheWVycyAoZXhjZXB0IGN1cnJlbnQgc2VsZWN0aW9uKVxuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHNlbGVjdGVkUGxheWVycywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IGF2YWlsYWJsZVBsYXllcnMuaW5kZXhPZih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlUGxheWVycy5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gYXZhaWxhYmxlUGxheWVycztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUZpbHRlckZvcihxdWVyeSkge1xuICAgICAgICAgICAgdmFyIGxvd2VyY2FzZVF1ZXJ5ID0gYW5ndWxhci5sb3dlcmNhc2UocXVlcnkpO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGZpbHRlckZuKHBsYXllcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAoYW5ndWxhci5sb3dlcmNhc2UocGxheWVyLm5hbWUpLmluZGV4T2YobG93ZXJjYXNlUXVlcnkpID09PSAwKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSB0aGF0IGEgcGxheWVyIGlzIG9ubHkgc2VsZWN0ZWQgb25jZSBpbiBhIHRlYW1cbiAgICAgICAgZnVuY3Rpb24gdmFsaWRhdGVUZWFtUGxheWVyKHRlYW0pIHtcbiAgICAgICAgICAgIGlmICh0ZWFtLnBsYXllcnMubGVuZ3RoID09IDIpIHtcbiAgICAgICAgICAgICAgICBpZiAodGVhbS5wbGF5ZXJzWzBdID09IHRlYW0ucGxheWVyc1sxXSAmJiB0ZWFtLnBsYXllcnNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSB0aGF0IGVhY2ggcGxheWVyIGlzIG9ubHkgc2VsZWN0ZWQgb25jZSBmb3IgdGhlIG1hdGNoXG4gICAgICAgIGZ1bmN0aW9uIHZhbGlkYXRlVW5pcXVlUGxheWVyKHRlYW0sIHBsYXllckluZGV4KSB7XG4gICAgICAgICAgICBpZiAoIXRlYW0ucGxheWVyc1twbGF5ZXJJbmRleF0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG9wcG9uZW50cztcbiAgICAgICAgICAgIGlmICh0ZWFtLnBsYXllcnMgPT0gc2VsZi5tYXRjaC50ZWFtMi5wbGF5ZXJzKSB7XG4gICAgICAgICAgICAgICAgb3Bwb25lbnRzID0gc2VsZi5tYXRjaC50ZWFtMS5wbGF5ZXJzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvcHBvbmVudHMgPSBzZWxmLm1hdGNoLnRlYW0yLnBsYXllcnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBkdXBsaWNhdGUgcGxheWVyIGluIG9wcG9uZW50IHRlYW1cbiAgICAgICAgICAgIHJldHVybiBvcHBvbmVudHMuaW5kZXhPZih0ZWFtLnBsYXllcnNbcGxheWVySW5kZXhdKSA8IDA7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBzYXZlKCkge1xuICAgICAgICAgICAgc2VsZi5pc1NhdmluZyA9IHRydWU7XG5cbiAgICAgICAgICAgIHZhciBzdWNjZXNzQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkbWRUb2FzdC5zaG93KFxuICAgICAgICAgICAgICAgICAgICAkbWRUb2FzdC5zaW1wbGUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRleHRDb250ZW50KCdNYXRjaCBlbnJlZ2lzdHLDqScpXG4gICAgICAgICAgICAgICAgICAgICAgICAucG9zaXRpb24oJ3RvcCByaWdodCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAuaGlkZURlbGF5KDMwMDApXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIHNlbGYuaXNTYXZpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnZGFzaGJvYXJkJyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIGVycm9yQ2FsbGJhY2sgPSBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHNlbGYuaXNTYXZpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIHZhciBlcnJvck1lc3NhZ2UgPSBcImVycmV1ciBzZXJ2ZXVyXCI7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gcmVzcG9uc2UuZGF0YS5lcnJvci5tZXNzYWdlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICRtZERpYWxvZy5zaG93KFxuICAgICAgICAgICAgICAgICAgICAkbWREaWFsb2cuYWxlcnQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNsaWNrT3V0c2lkZVRvQ2xvc2UodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aXRsZSgnRXJyZXVyJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC50ZXh0Q29udGVudCgnTGEgc2F1dmVnYXJkZSBhIMOpY2hvdcOpZSAoJyArIGVycm9yTWVzc2FnZSArICcpJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vaygnT0snKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgbWF0Y2g7XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmVkaXRNb2RlKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2ggPSBhbmd1bGFyLmV4dGVuZCh7fSwgc2VsZi5tYXRjaCk7XG5cbiAgICAgICAgICAgICAgICBtYXRjaC50ZWFtMSA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCBtYXRjaC50ZWFtMSk7XG4gICAgICAgICAgICAgICAgbWF0Y2gudGVhbTIgPSBhbmd1bGFyLmV4dGVuZCh7fSwgbWF0Y2gudGVhbTIpO1xuXG4gICAgICAgICAgICAgICAgbWF0Y2gudGVhbTEucGxheWVycyA9IG1hdGNoLnRlYW0xLnBsYXllcnMubWFwKGZ1bmN0aW9uKHBsYXllcil7IHJldHVybiBwbGF5ZXIuX2lkIH0pO1xuICAgICAgICAgICAgICAgIG1hdGNoLnRlYW0yLnBsYXllcnMgPSBtYXRjaC50ZWFtMi5wbGF5ZXJzLm1hcChmdW5jdGlvbihwbGF5ZXIpeyByZXR1cm4gcGxheWVyLl9pZCB9KTtcblxuICAgICAgICAgICAgICAgIE1hdGNoLnVwZGF0ZShtYXRjaCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWF0Y2ggPSBuZXcgTWF0Y2goYW5ndWxhci5leHRlbmQoe30sIHNlbGYubWF0Y2gpKTtcblxuICAgICAgICAgICAgICAgIG1hdGNoLnRlYW0xID0gYW5ndWxhci5leHRlbmQoe30sIG1hdGNoLnRlYW0xKTtcbiAgICAgICAgICAgICAgICBtYXRjaC50ZWFtMiA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCBtYXRjaC50ZWFtMik7XG5cbiAgICAgICAgICAgICAgICBtYXRjaC50ZWFtMS5wbGF5ZXJzID0gbWF0Y2gudGVhbTEucGxheWVycy5tYXAoZnVuY3Rpb24ocGxheWVyKXsgcmV0dXJuIHBsYXllci5faWQgfSk7XG4gICAgICAgICAgICAgICAgbWF0Y2gudGVhbTIucGxheWVycyA9IG1hdGNoLnRlYW0yLnBsYXllcnMubWFwKGZ1bmN0aW9uKHBsYXllcil7IHJldHVybiBwbGF5ZXIuX2lkIH0pO1xuXG4gICAgICAgICAgICAgICAgTWF0Y2guc2F2ZShtYXRjaCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZU1hdGNoKCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpcm0oXCJWb3VsZXotdm91cyB2cmFpbWVudCBzdXBwcmltZXIgY2UgbWF0Y2g/XCIpKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5pc1NhdmluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBNYXRjaC5kZWxldGUoe2lkOiBzZWxmLm1hdGNoLl9pZH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJG1kVG9hc3Quc2hvdyhcbiAgICAgICAgICAgICAgICAgICAgICAgICRtZFRvYXN0LnNpbXBsZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHRDb250ZW50KCdNYXRjaCBzdXBwcmltw6knKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vLmFjdGlvbignQU5OVUxFUicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmhpZ2hsaWdodEFjdGlvbih0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3NpdGlvbigndG9wIHJpZ2h0JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuaGlkZURlbGF5KDMwMDApXG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pc1NhdmluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnZGFzaGJvYXJkJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnc2NvcmVBcHAuY29udHJvbGxlcnMnKVxuICAgICAgICAuY29udHJvbGxlcignTG9naW5Db250cm9sbGVyJywgTG9naW5Db250cm9sbGVyKTtcblxuICAgIGZ1bmN0aW9uIExvZ2luQ29udHJvbGxlciAoY29uZmlnLCAkbWREaWFsb2csICRsb2NhdGlvbiwgJHNjZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi5ncm91cE5hbWUgPSBjb25maWcuZ3JvdXAubmFtZTtcblxuICAgICAgICB2YXIgcXVlcnlTdHJpbmdWYWx1ZSA9IGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgICAgICAgdmFyIGhyZWYgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgICAgICAgIHZhciByZWcgPSBuZXcgUmVnRXhwKCAnWz8mXScgKyBmaWVsZCArICc9KFteJiNdKiknLCAnaScgKTtcbiAgICAgICAgICAgIHZhciBzdHJpbmcgPSByZWcuZXhlYyhocmVmKTtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmcgPyBzdHJpbmdbMV0gOiBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBhdXRoRXJyb3IgPSBxdWVyeVN0cmluZ1ZhbHVlKCdlcnJvcicpO1xuXG4gICAgICAgIGlmIChhdXRoRXJyb3IpIHtcbiAgICAgICAgICAgIHZhciBhdXRoRXJyb3JNZXNzYWdlO1xuICAgICAgICAgICAgc3dpdGNoKGF1dGhFcnJvcikge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3VuYXV0aG9yaXplZC1lbWFpbC1kb21haW4nOlxuICAgICAgICAgICAgICAgICAgICBhdXRoRXJyb3JNZXNzYWdlID0gXCJDZSBjb21wdGUgR29vZ2xlIG5lIGZhaXQgcGFzIHBhcnRpZSA8YnI+ZGVzIGRvbWFpbmVzIGF1dG9yaXPDqXMgcG91ciBcIiArIGNvbmZpZy5ncm91cC5uYW1lICsgXCIuXCI7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGF1dGhFcnJvck1lc3NhZ2UgPSBcIkVycmV1ciBpbmNvbm51ZSBsb3JzIGRlIGwnYXV0aGVudGlmaWNhdGlvbiB2aWEgR29vZ2xlXCI7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkbWREaWFsb2cuc2hvdyhcbiAgICAgICAgICAgICAgICAkbWREaWFsb2cuYWxlcnQoKVxuICAgICAgICAgICAgICAgICAgICAuY2xpY2tPdXRzaWRlVG9DbG9zZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICAudGl0bGUoJ0VycmV1cicpXG4gICAgICAgICAgICAgICAgICAgIC5odG1sQ29udGVudCgkc2NlLnRydXN0QXNIdG1sKGF1dGhFcnJvck1lc3NhZ2UpKVxuICAgICAgICAgICAgICAgICAgICAub2soJ09LJylcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnc2NvcmVBcHAuY29udHJvbGxlcnMnKVxuICAgICAgICAuY29udHJvbGxlcignTWF0Y2hDb250cm9sbGVyJywgTWF0Y2hDb250cm9sbGVyKTtcblxuICAgIGZ1bmN0aW9uIE1hdGNoQ29udHJvbGxlciAoTWF0Y2gsIG1hdGNoSWQsICRtZERpYWxvZywgJHN0YXRlLCBQbGF5ZXJNYW5hZ2VyKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLm1hdGNoID0ge307XG4gICAgICAgIHNlbGYucGxheWVyTmFtZXMgPSBQbGF5ZXJNYW5hZ2VyLm5hbWVzO1xuICAgICAgICBzZWxmLmVkaXRNYXRjaCA9IGVkaXRNYXRjaDtcbiAgICAgICAgc2VsZi5jbG9zZSA9IGNsb3NlO1xuXG4gICAgICAgIE1hdGNoLmdldCh7aWQ6IG1hdGNoSWR9LCBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgICAgICAgc2VsZi5tYXRjaCA9IG1hdGNoO1xuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICAgICAgICAgICRtZERpYWxvZy5jYW5jZWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVkaXRNYXRjaChtYXRjaElkKSB7XG4gICAgICAgICAgICAkbWREaWFsb2cuY2FuY2VsKCk7XG5cbiAgICAgICAgICAgICRzdGF0ZS5nbygnZWRpdCcsIHttYXRjaElkOiBtYXRjaElkfSk7XG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnc2NvcmVBcHAuY29udHJvbGxlcnMnKVxuICAgICAgICAuY29udHJvbGxlcignU3RhdHNDb250cm9sbGVyJywgU3RhdHNDb250cm9sbGVyKTtcblxuICAgIGZ1bmN0aW9uIFN0YXRzQ29udHJvbGxlciAoUGxheWVyTWFuYWdlciwgU3RhdGlzdGljLCBtb21lbnQsIFBFUklPRFMpe1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi5wbGF5ZXJDb2xvcnMgPSBQbGF5ZXJNYW5hZ2VyLmNvbG9ycztcbiAgICAgICAgc2VsZi5wbGF5ZXJOYW1lcyA9IFBsYXllck1hbmFnZXIubmFtZXM7XG4gICAgICAgIHNlbGYucGVyaW9kcyA9IFtcbiAgICAgICAgICAgIHt2YWx1ZTogUEVSSU9EUy5XRUVLLCBuYW1lOiAnNyBqb3Vycyd9LFxuICAgICAgICAgICAge3ZhbHVlOiBQRVJJT0RTLlRXT1dFRUssIG5hbWU6ICcxNCBqb3Vycyd9LFxuICAgICAgICAgICAge3ZhbHVlOiBQRVJJT0RTLk1PTlRILCBuYW1lOiAnMzAgam91cnMnfSxcbiAgICAgICAgICAgIC8ve3ZhbHVlOiBQRVJJT0RTLlFVQVJURVIsIG5hbWU6ICczIG1vaXMnfVxuICAgICAgICBdO1xuXG4gICAgICAgIHNlbGYuc2VsZWN0ZWRQZXJpb2QgPSBQRVJJT0RTLk1PTlRIO1xuICAgICAgICB2YXIgX2RhdGVSYW5nZSA9IFN0YXRpc3RpYy5nZXREYXRlUmFuZ2VGb3JQZXJpb2Qoc2VsZi5zZWxlY3RlZFBlcmlvZCk7XG5cbiAgICAgICAgc2VsZi5jaGFydE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBhbmltYXRpb246IGZhbHNlLFxuICAgICAgICAgICAgc2NhbGVPdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgIHNjYWxlU3RlcHM6IDEwLFxuICAgICAgICAgICAgc2NhbGVTdGVwV2lkdGg6IDEwLFxuICAgICAgICAgICAgc2NhbGVTdGFydFZhbHVlOiAwLFxuICAgICAgICAgICAgYmV6aWVyQ3VydmU6IGZhbHNlLFxuICAgICAgICAgICAgcG9pbnRIaXREZXRlY3Rpb25SYWRpdXMgOiAxMCxcbiAgICAgICAgICAgIC8vcG9pbnREb3Q6IGZhbHNlLFxuICAgICAgICAgICAgdG9vbHRpcFRlbXBsYXRlOiBcIjwlaWYgKGxhYmVsKXslPjwlPWxhYmVsJT4gOiA8JX0lPjwlPSB2YWx1ZSAlPiAlXCJcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnBlcmlvZFN0YXRzID0ge1xuICAgICAgICAgICAgZHVvOiB7XG4gICAgICAgICAgICAgICAgbGVhZGVyYm9hcmQ6IFtdLFxuICAgICAgICAgICAgICAgIGNoYXJ0RGF0YToge31cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzb2xvOiB7XG4gICAgICAgICAgICAgICAgbGVhZGVyYm9hcmQ6IFtdLFxuICAgICAgICAgICAgICAgIGNoYXJ0RGF0YToge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnNldFNlbGVjdGVkUGVyaW9kID0gc2V0U2VsZWN0ZWRQZXJpb2Q7XG5cbiAgICAgICAgZnVuY3Rpb24gc2V0U2VsZWN0ZWRQZXJpb2Qoc2VsZWN0ZWRQZXJpb2QpIHtcbiAgICAgICAgICAgIHNlbGYuc2VsZWN0ZWRQZXJpb2QgPSBzZWxlY3RlZFBlcmlvZDtcbiAgICAgICAgICAgIF9kYXRlUmFuZ2UgPSBTdGF0aXN0aWMuZ2V0RGF0ZVJhbmdlRm9yUGVyaW9kKHNlbGVjdGVkUGVyaW9kKTtcblxuICAgICAgICAgICAgZmV0Y2hTdGF0aXN0aWNzRm9yRGF0ZVJhbmdlKF9kYXRlUmFuZ2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZmV0Y2hTdGF0aXN0aWNzRm9yRGF0ZVJhbmdlKGRhdGVSYW5nZSkge1xuICAgICAgICAgICAgU3RhdGlzdGljLmdldFdpbm5pbmdQZXJjZW50YWdlc0ZvckRhdGVSYW5nZShkYXRlUmFuZ2UpLnRoZW4oZnVuY3Rpb24ocGVyaW9kUGVyY2VudGFnZXMpe1xuICAgICAgICAgICAgICAgIHZhciBsZWFkZXJib2FyZHMgPSBTdGF0aXN0aWMuY3JlYXRlTGVhZGVyYm9hcmRzRnJvbVdpbm5pbmdQZXJjZW50YWdlcyhwZXJpb2RQZXJjZW50YWdlcyk7XG4gICAgICAgICAgICAgICAgc2VsZi5wZXJpb2RTdGF0cy5zb2xvLmxlYWRlcmJvYXJkID0gbGVhZGVyYm9hcmRzLnNvbG87XG4gICAgICAgICAgICAgICAgc2VsZi5wZXJpb2RTdGF0cy5kdW8ubGVhZGVyYm9hcmQgPSBsZWFkZXJib2FyZHMuZHVvO1xuXG4gICAgICAgICAgICAgICAgc2VsZi5wZXJpb2RTdGF0cy5zb2xvLmNoYXJ0RGF0YSA9IGFuZ3VsYXIuZXh0ZW5kKFxuICAgICAgICAgICAgICAgICAgICBzZWxmLnBlcmlvZFN0YXRzLnNvbG8uY2hhcnREYXRhLCBjcmVhdGVDaGFydERhdGEocGVyaW9kUGVyY2VudGFnZXMuc29sbylcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHNlbGYucGVyaW9kU3RhdHMuZHVvLmNoYXJ0RGF0YSA9IGFuZ3VsYXIuZXh0ZW5kKFxuICAgICAgICAgICAgICAgICAgICBzZWxmLnBlcmlvZFN0YXRzLmR1by5jaGFydERhdGEsIGNyZWF0ZUNoYXJ0RGF0YShwZXJpb2RQZXJjZW50YWdlcy5kdW8pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTGFiZWxzRm9ySW50ZXJ2YWwoc3RhcnREYXRlLCBlbmREYXRlKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudERhdGUgPSBtb21lbnQoc3RhcnREYXRlKTtcbiAgICAgICAgICAgIHZhciBsYWJlbHMgPSBbXTtcblxuICAgICAgICAgICAgd2hpbGUgKGN1cnJlbnREYXRlLnRvRGF0ZSgpIDw9IGVuZERhdGUpIHtcbiAgICAgICAgICAgICAgICBsYWJlbHMucHVzaChjdXJyZW50RGF0ZS5mb3JtYXQoJ0QgTU1NJykpO1xuXG4gICAgICAgICAgICAgICAgY3VycmVudERhdGUgPSBjdXJyZW50RGF0ZS5hZGQoMSwgJ2QnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGxhYmVscztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUNoYXJ0U2VyaWVzKHBsYXllclBlcmNlbnRhZ2VzKSB7XG4gICAgICAgICAgICB2YXIgc2VyaWVzID0ge30sXG4gICAgICAgICAgICAgICAgY291bnQgPSAxO1xuXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2gocGxheWVyUGVyY2VudGFnZXMsIGZ1bmN0aW9uIChkYXlTdGF0cykge1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChkYXlTdGF0cy5wZXJjZW50YWdlcywgZnVuY3Rpb24gKHBsYXllclN0YXRzLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXNlcmllc1twbGF5ZXJTdGF0cy5wbGF5ZXJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJpZXNbcGxheWVyU3RhdHMucGxheWVyXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgc2VyaWVzW3BsYXllclN0YXRzLnBsYXllcl0ucHVzaChNYXRoLnJvdW5kKHBsYXllclN0YXRzLndpblBlcmNlbnQgKiAxMDAwMCkgLyAxMDApO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKFBsYXllck1hbmFnZXIucGxheWVycywgZnVuY3Rpb24ocGxheWVyLCBpZCl7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2VyaWVzW2lkXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWVzW2lkXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlcmllc1tpZF0ubGVuZ3RoIDwgY291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc1tpZF0ucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gc2VyaWVzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlQ2hhcnREYXRhKHBsYXllclBlcmNlbnRhZ2VzKSB7XG4gICAgICAgICAgICB2YXIgc2VyaWVzID0gY3JlYXRlQ2hhcnRTZXJpZXMocGxheWVyUGVyY2VudGFnZXMpO1xuXG4gICAgICAgICAgICB2YXIgZ2V0UGxheWVyTmFtZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucGxheWVyTmFtZXNbaWRdO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzZXJpZXM6IE9iamVjdC5rZXlzKHNlcmllcykubWFwKGdldFBsYXllck5hbWUpLFxuICAgICAgICAgICAgICAgIGRhdGE6IGV4dHJhY3RTZXJpZXNEYXRhKHNlcmllcyksXG4gICAgICAgICAgICAgICAgY29sb3JzOiBnZXRDb2xvcnNGb3JTZXJpZXMoc2VyaWVzKSxcbiAgICAgICAgICAgICAgICBsYWJlbHM6IGNyZWF0ZUxhYmVsc0ZvckludGVydmFsKF9kYXRlUmFuZ2Uuc3RhcnREYXRlLCBfZGF0ZVJhbmdlLmVuZERhdGUpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXh0cmFjdFNlcmllc0RhdGEoc2VyaWVzKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IFtdO1xuXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VyaWVzLCBmdW5jdGlvbiAoc2VyaWUpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnB1c2goc2VyaWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Q29sb3JzRm9yU2VyaWVzKHNlcmllcykge1xuICAgICAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VyaWVzLCBmdW5jdGlvbiAoc2VyaWUsIHBsYXllck5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb2xvcnMucHVzaChzZWxmLnBsYXllckNvbG9yc1twbGF5ZXJOYW1lXSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGNvbG9ycztcbiAgICAgICAgfVxuXG4gICAgICAgIGZldGNoU3RhdGlzdGljc0ZvckRhdGVSYW5nZShfZGF0ZVJhbmdlKTtcbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnc2NvcmVBcHAuc2VydmljZXMnKVxuICAgICAgICAuZmFjdG9yeSgnTWF0Y2gnLCBNYXRjaCk7XG5cbiAgICBmdW5jdGlvbiBNYXRjaCAoJHJlc291cmNlKXtcbiAgICAgICAgdmFyIHJlc291cmNlID0gICRyZXNvdXJjZSgnL2FwaS9tYXRjaGVzLzppZCcsIHtpZDonQF9pZCd9LCB7XG4gICAgICAgICAgICBxdWVyeToge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgaXNBcnJheTogZmFsc2UsXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2U6IFtmdW5jdGlvbihkYXRhLCBoZWFkZXJzR2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKCBoZWFkZXJzR2V0dGVyKCdYLVRvdGFsLUNvdW50JykgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZS50b3RhbENvdW50ID0gTnVtYmVyKGhlYWRlcnNHZXR0ZXIoJ1gtVG90YWwtQ291bnQnKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhci5mcm9tSnNvbihkYXRhKTtcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwZGF0ZToge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BVVCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVzb3VyY2UudG90YWxDb3VudCA9IDA7XG5cbiAgICAgICAgcmV0dXJuIHJlc291cmNlO1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5zZXJ2aWNlcycpXG4gICAgICAgIC5mYWN0b3J5KCdQbGF5ZXInLCBQbGF5ZXIpO1xuXG4gICAgZnVuY3Rpb24gUGxheWVyICgkcmVzb3VyY2Upe1xuICAgICAgICByZXR1cm4gJHJlc291cmNlKCcvYXBpL3BsYXllcnMnLCB7fSwge1xuICAgICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIGlzQXJyYXk6IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5zZXJ2aWNlcycpXG4gICAgICAgIC5mYWN0b3J5KCdVc2VyJywgVXNlcik7XG5cbiAgICBmdW5jdGlvbiBVc2VyICgkcmVzb3VyY2Upe1xuICAgICAgICByZXR1cm4gJHJlc291cmNlKCcvYXBpL3VzZXInLCB7fSwge1xuICAgICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIGlzQXJyYXk6IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5zZXJ2aWNlcycpXG4gICAgICAgIC5mYWN0b3J5KCdBdXRoJywgQXV0aFNlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gQXV0aFNlcnZpY2UoJHJvb3RTY29wZSwgJGh0dHAsIEFVVEhfRVZFTlRTLCBsb2NhbFN0b3JhZ2VTZXJ2aWNlKSB7XG4gICAgICAgIHZhciBBdXRoU2VydmljZSA9IHtcbiAgICAgICAgICAgIHVzZXI6IG51bGwsXG4gICAgICAgICAgICBhdXRoZW50aWNhdGVkOiBmYWxzZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFJldHJpZXZlIHVzZXIgYXV0aCBkZXRhaWxzIGZyb20gbG9jYWwgc3RvcmFnZVxuICAgICAgICBpZiAobG9jYWxTdG9yYWdlU2VydmljZS5pc1N1cHBvcnRlZCkge1xuICAgICAgICAgICAgdmFyIHVzZXIgPSBsb2NhbFN0b3JhZ2VTZXJ2aWNlLmdldCgndXNlcicpO1xuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5hdXRoZW50aWNhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICRodHRwKHsgbWV0aG9kOiAnR0VUJywgdXJsOiAnL2FwaS91c2VyJyB9KVxuXG4gICAgICAgICAgICAgICAgLy8gVXNlciBzdWNjZXNzZnVsbHkgYXV0aGVudGljYXRlc1xuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmF1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBBdXRoU2VydmljZS51c2VyID0gZGF0YTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB1c2VyIGF1dGggZGV0YWlscyBpbiBsb2NhbCBzdG9yYWdlXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2NhbFN0b3JhZ2VTZXJ2aWNlLmlzU3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2VTZXJ2aWNlLnNldCgndXNlcicsIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZihjYWxsYmFjaykgPT09IHR5cGVvZihGdW5jdGlvbikpIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC8vIE5vdCBsb2dnZWQgaW5cbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24oZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBBdXRoU2VydmljZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAobG9jYWxTdG9yYWdlU2VydmljZS5pc1N1cHBvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlU2VydmljZS5yZW1vdmUoJ3VzZXInKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YoY2FsbGJhY2spID09PSB0eXBlb2YoRnVuY3Rpb24pKSBjYWxsYmFjaygpO1xuXG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpbkZhaWxlZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZihjYWxsYmFjaykgPT09IHR5cGVvZihGdW5jdGlvbikpIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIEF1dGhTZXJ2aWNlLnVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICAkaHR0cCh7IG1ldGhvZDogJ0dFVCcsIHVybDogJy9sb2dvdXQnIH0pXG5cbiAgICAgICAgICAgIC8vIFVzZXIgc3VjY2Vzc2Z1bGx5IGxvZ2dlZCBvdXRcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9jYWxTdG9yYWdlU2VydmljZS5pc1N1cHBvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlU2VydmljZS5yZW1vdmUoJ3VzZXInKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YoY2FsbGJhY2spID09PSB0eXBlb2YoRnVuY3Rpb24pKSBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAvLyBTaWduIG91dCBlcnJvclxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mKGNhbGxiYWNrKSA9PT0gdHlwZW9mKEZ1bmN0aW9uKSkgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuYXV0aGVudGljYXRlZDtcbiAgICAgICAgfTtcblxuICAgICAgICBBdXRoU2VydmljZS5pc0F1dGhvcml6ZWQgPSBmdW5jdGlvbiAoYXV0aG9yaXplZFJvbGVzKSB7XG4gICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNBcnJheShhdXRob3JpemVkUm9sZXMpKSB7XG4gICAgICAgICAgICAgICAgYXV0aG9yaXplZFJvbGVzID0gW2F1dGhvcml6ZWRSb2xlc107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKEF1dGhTZXJ2aWNlLmF1dGhlbnRpY2F0ZWQgJiYgYXV0aG9yaXplZFJvbGVzLmluZGV4T2YoQXV0aFNlcnZpY2UudXNlci5yb2xlKSAhPT0gLTEpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBBdXRoU2VydmljZTtcbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnc2NvcmVBcHAuc2VydmljZXMnKVxuICAgICAgICAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgQXV0aEludGVyY2VwdG9yKTtcblxuICAgIGZ1bmN0aW9uIEF1dGhJbnRlcmNlcHRvcigkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCh7XG4gICAgICAgICAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgICAgICAgICAgfVtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ3Njb3JlQXBwLnNlcnZpY2VzJylcbiAgICAgICAgLmZhY3RvcnkoJ0F1dGhSZXNvbHZlcicsIEF1dGhSZXNvbHZlcik7XG5cbiAgICBmdW5jdGlvbiBBdXRoUmVzb2x2ZXIoJHEsICRyb290U2NvcGUsICRzdGF0ZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzb2x2ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgdmFyIHVud2F0Y2ggPSAkcm9vdFNjb3BlLiR3YXRjaCgnY3VycmVudFVzZXInLCBmdW5jdGlvbiAoY3VycmVudFVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKGN1cnJlbnRVc2VyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRVc2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShjdXJyZW50VXNlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgdW53YXRjaCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ3Njb3JlQXBwLnNlcnZpY2VzJylcbiAgICAgICAgLmZhY3RvcnkoJ0NvbmZpZycsIENvbmZpZyk7XG5cbiAgICBmdW5jdGlvbiBDb25maWcgKCRodHRwLCAkcSkge1xuICAgICAgICB2YXIgQ29uZmlnID0ge1xuICAgICAgICAgICAgYXBwOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgQ29uZmlnLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChDb25maWcuYXBwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIENvbmZpZy5hcHA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBwcm9taXNlID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAgICAgICAgICRodHRwKHttZXRob2Q6ICdHRVQnLCB1cmw6ICcvYXBpL2NvbmZpZyd9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIENvbmZpZy5hcHAgPSByZXNwb25zZS5kYXRhO1xuXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UucmVzb2x2ZShDb25maWcuYXBwKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlLnByb21pc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIENvbmZpZztcbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnc2NvcmVBcHAuc2VydmljZXMnKVxuICAgICAgICAuZmFjdG9yeSgnUGxheWVyTWFuYWdlcicsIFBsYXllck1hbmFnZXIpO1xuXG4gICAgZnVuY3Rpb24gUGxheWVyTWFuYWdlciAoUGxheWVyKXtcbiAgICAgICAgdmFyIGNvbG9ycyA9IFtcbiAgICAgICAgICAgICcjMzA0ZmZlJyxcbiAgICAgICAgICAgICcjYWEwMGZmJyxcbiAgICAgICAgICAgICcjZDUwMDAwJyxcbiAgICAgICAgICAgICcjMDA5MWVhJyxcbiAgICAgICAgICAgICcjMDBjODUzJyxcbiAgICAgICAgICAgICcjYWVlYTAwJyxcbiAgICAgICAgICAgICcjZmY2ZDAwJyxcbiAgICAgICAgICAgICcjNWQ0MDM3JyxcbiAgICAgICAgICAgICdjeWFuJyxcbiAgICAgICAgICAgICdwdXJwbGUnXG4gICAgICAgIF07XG5cbiAgICAgICAgdmFyIFBsYXllck1hbmFnZXIgPSB7fTtcblxuICAgICAgICBQbGF5ZXJNYW5hZ2VyLnBsYXllcnMgPSB7fTtcbiAgICAgICAgUGxheWVyTWFuYWdlci5uYW1lcyA9IHt9O1xuICAgICAgICBQbGF5ZXJNYW5hZ2VyLmNvbG9ycyA9IHt9O1xuXG4gICAgICAgIFBsYXllck1hbmFnZXIuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHByb21pc2UgPSBQbGF5ZXIucXVlcnkoKS4kcHJvbWlzZTtcblxuICAgICAgICAgICAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKG9iamVjdHMpe1xuICAgICAgICAgICAgICAgIHZhciBpID0gMDtcblxuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChvYmplY3RzLCBmdW5jdGlvbihwbGF5ZXIsIGlkKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlkICE9ICckcHJvbWlzZScgJiYgaWQgIT0gJyRyZXNvbHZlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYXllci5jb2xvciA9IGNvbG9yc1tpXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgUGxheWVyTWFuYWdlci5wbGF5ZXJzW2lkXSA9IHBsYXllcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIFBsYXllck1hbmFnZXIubmFtZXNbaWRdID0gcGxheWVyLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBQbGF5ZXJNYW5hZ2VyLmNvbG9yc1tpZF0gPSBwbGF5ZXIuY29sb3I7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBQbGF5ZXJNYW5hZ2VyO1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5zZXJ2aWNlcycpXG4gICAgICAgIC5mYWN0b3J5KCdTdGF0aXN0aWMnLCBTdGF0aXN0aWNTZXJ2aWNlKTtcblxuICAgIGZ1bmN0aW9uIFN0YXRpc3RpY1NlcnZpY2UoJGh0dHAsIG1vbWVudCwgUEVSSU9EUyl7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXREYXRlUmFuZ2VGb3JQZXJpb2Q6IGZ1bmN0aW9uKHBlcmlvZCkge1xuICAgICAgICAgICAgICAgIHZhciBzdGFydERhdGU7XG4gICAgICAgICAgICAgICAgdmFyIGVuZERhdGUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoKHBlcmlvZCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFBFUklPRFMuV0VFSzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0RGF0ZSA9IG1vbWVudCgpLnN1YnRyYWN0KDcsICdkYXlzJykudG9EYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBQRVJJT0RTLlRXT1dFRUs6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydERhdGUgPSBtb21lbnQoKS5zdWJ0cmFjdCgxNCwgJ2RheXMnKS50b0RhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFBFUklPRFMuTU9OVEg6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydERhdGUgPSBtb21lbnQoKS5zdWJ0cmFjdCgxLCAnbW9udGgnKS50b0RhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFBFUklPRFMuUVVBUlRFUjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0RGF0ZSA9IG1vbWVudCgpLnN1YnRyYWN0KDMsICdtb250aHMnKS50b0RhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtzdGFydERhdGU6IHN0YXJ0RGF0ZSwgZW5kRGF0ZTogZW5kRGF0ZX07XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBnZXRXaW5uaW5nUGVyY2VudGFnZXNGb3JEYXRlUmFuZ2U6IGZ1bmN0aW9uKGRhdGVSYW5nZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9hcGkvd2lubmluZ1BlcmNlbnRhZ2VzP3N0YXJ0RGF0ZT0nICsgbW9tZW50KGRhdGVSYW5nZS5zdGFydERhdGUpLmZvcm1hdCgnWVlZWS1NTS1ERCcpICsgJyZlbmREYXRlPScgKyBtb21lbnQoZGF0ZVJhbmdlLmVuZERhdGUpLmZvcm1hdCgnWVlZWS1NTS1ERCcpXG4gICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNyZWF0ZUxlYWRlcmJvYXJkc0Zyb21XaW5uaW5nUGVyY2VudGFnZXM6IGZ1bmN0aW9uKHdpbm5pbmdQZXJjZW50YWdlcykge1xuICAgICAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1QbGF5ZXJTdGF0cyA9IGZ1bmN0aW9uKHBsYXllclN0YXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3aW5QZXJjZW50ID0gTWF0aC5yb3VuZChwbGF5ZXJTdGF0cy53aW5QZXJjZW50ICogMTAwMDApIC8gMTAwO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmV4dGVuZCh7fSwgcGxheWVyU3RhdHMsIHt3aW5QZXJjZW50OiB3aW5QZXJjZW50fSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHNvbG86IHdpbm5pbmdQZXJjZW50YWdlcy5zb2xvW3dpbm5pbmdQZXJjZW50YWdlcy5zb2xvLmxlbmd0aCAtIDFdLnBlcmNlbnRhZ2VzLm1hcCh0cmFuc2Zvcm1QbGF5ZXJTdGF0cyksXG4gICAgICAgICAgICAgICAgICAgIGR1bzogd2lubmluZ1BlcmNlbnRhZ2VzLmR1b1t3aW5uaW5nUGVyY2VudGFnZXMuZHVvLmxlbmd0aCAtIDFdLnBlcmNlbnRhZ2VzLm1hcCh0cmFuc2Zvcm1QbGF5ZXJTdGF0cylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbn0pKCk7Il19
