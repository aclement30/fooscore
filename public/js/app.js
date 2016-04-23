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
                match.date = new Date(match.date);
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
                match = self.match;

                match.team1.players = match.team1.players.map(function(player){ return player._id });
                match.team2.players = match.team2.players.map(function(player){ return player._id });

                Match.update(match, successCallback, errorCallback);
            } else {
                match = new Match();

                match.date = self.match.date;
                match.team1 = self.match.team1;
                match.team2 = self.match.team2;
                match.balls = self.match.balls;
                match.comments = self.match.comments;

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

    function LoginController (config) {
        var self = this;

        self.groupName = config.group.name;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvYXBwIiwic3JjL2pzL2NvbnRyb2xsZXJzL0FwcENvbnRyb2xsZXIuanMiLCJzcmMvanMvY29udHJvbGxlcnMvRGFzaGJvYXJkQ29udHJvbGxlci5qcyIsInNyYy9qcy9jb250cm9sbGVycy9FZGl0TWF0Y2hDb250cm9sbGVyLmpzIiwic3JjL2pzL2NvbnRyb2xsZXJzL0xvZ2luQ29udHJvbGxlci5qcyIsInNyYy9qcy9jb250cm9sbGVycy9NYXRjaENvbnRyb2xsZXIuanMiLCJzcmMvanMvY29udHJvbGxlcnMvU3RhdHNDb250cm9sbGVyLmpzIiwic3JjL2pzL21vZGVscy9NYXRjaC5qcyIsInNyYy9qcy9tb2RlbHMvUGxheWVyLmpzIiwic3JjL2pzL21vZGVscy9Vc2VyLmpzIiwic3JjL2pzL3NlcnZpY2VzL0F1dGguanMiLCJzcmMvanMvc2VydmljZXMvQXV0aEludGVyY2VwdG9yLmpzIiwic3JjL2pzL3NlcnZpY2VzL0F1dGhSZXNvbHZlci5qcyIsInNyYy9qcy9zZXJ2aWNlcy9Db25maWcuanMiLCJzcmMvanMvc2VydmljZXMvUGxheWVyTWFuYWdlci5qcyIsInNyYy9qcy9zZXJ2aWNlcy9TdGF0aXN0aWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbi8vIERlY2xhcmUgYXBwIGxldmVsIG1vZHVsZSB3aGljaCBkZXBlbmRzIG9uIGZpbHRlcnMsIGFuZCBzZXJ2aWNlc1xuYW5ndWxhci5tb2R1bGUoJ3Njb3JlQXBwJywgW1xuICAgICAgICAnc2NvcmVBcHAuY29udHJvbGxlcnMnLFxuICAgICAgICAnc2NvcmVBcHAuc2VydmljZXMnLFxuICAgICAgICAnc2NvcmVBcHAuZGlyZWN0aXZlcycsXG4gICAgICAgICd1aS5yb3V0ZXInLFxuICAgICAgICAnbmdNYXRlcmlhbCcsXG4gICAgICAgICduZ1Jlc291cmNlJyxcbiAgICAgICAgJ25nTWVzc2FnZXMnLFxuICAgICAgICAnYW5ndWxhck1vbWVudCcsXG4gICAgICAgICdtZC5kYXRhLnRhYmxlJyxcbiAgICAgICAgJ2NoYXJ0LmpzJyxcbiAgICAgICAgJ0xvY2FsU3RvcmFnZU1vZHVsZSdcbiAgICBdKVxuICAgIC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pXG4gICAgLmNvbnN0YW50KCdVU0VSX1JPTEVTJywge1xuICAgICAgICBhbGw6ICcqJyxcbiAgICAgICAgYWRtaW46ICdhZG1pbicsXG4gICAgICAgIHBsYXllcjogJ3BsYXllcicsXG4gICAgICAgIGd1ZXN0OiAnZ3Vlc3QnXG4gICAgfSlcbiAgICAuY29uc3RhbnQoJ1BFUklPRFMnLCB7XG4gICAgICAgICdXRUVLJzogJzdEJyxcbiAgICAgICAgJ1RXT1dFRUsnOiAnMTREJyxcbiAgICAgICAgJ01PTlRIJzogJzMwRCcsXG4gICAgICAgICdRVUFSVEVSJzogJzNNJ1xuICAgIH0pXG4gICAgLmNvbmZpZyhbXG4gICAgICAgICckc3RhdGVQcm92aWRlcicsXG4gICAgICAgICckdXJsUm91dGVyUHJvdmlkZXInLFxuICAgICAgICAnJG1kVGhlbWluZ1Byb3ZpZGVyJyxcbiAgICAgICAgJyRtZEljb25Qcm92aWRlcicsXG4gICAgICAgICdDaGFydEpzUHJvdmlkZXInLFxuICAgICAgICAnJG1kRGF0ZUxvY2FsZVByb3ZpZGVyJyxcbiAgICAgICAgJ21vbWVudCcsXG4gICAgICAgICckaHR0cFByb3ZpZGVyJyxcbiAgICAgICAgJ1VTRVJfUk9MRVMnLFxuICAgICAgICAnbG9jYWxTdG9yYWdlU2VydmljZVByb3ZpZGVyJyxcblxuICAgICAgICBmdW5jdGlvbigkc3RhdGVQcm92aWRlcixcbiAgICAgICAgICAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLFxuICAgICAgICAgICAgICAgICAkbWRUaGVtaW5nUHJvdmlkZXIsXG4gICAgICAgICAgICAgICAgICRtZEljb25Qcm92aWRlcixcbiAgICAgICAgICAgICAgICAgQ2hhcnRKc1Byb3ZpZGVyLFxuICAgICAgICAgICAgICAgICAkbWREYXRlTG9jYWxlUHJvdmlkZXIsXG4gICAgICAgICAgICAgICAgIG1vbWVudCxcbiAgICAgICAgICAgICAgICAgJGh0dHBQcm92aWRlcixcbiAgICAgICAgICAgICAgICAgVVNFUl9ST0xFUyxcbiAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlU2VydmljZVByb3ZpZGVyKSB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2VTZXJ2aWNlUHJvdmlkZXJcbiAgICAgICAgICAgICAgICAuc2V0UHJlZml4KCdmb29zY29yZScpO1xuXG4gICAgICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvZGFzaGJvYXJkJyk7XG5cbiAgICAgICAgICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9sb2dpbi5odG1sJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWc6IGZ1bmN0aW9uIChDb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gQ29uZmlnLmluaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ21haW4nLCB7XG4gICAgICAgICAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJzx1aS12aWV3Lz4nLFxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGF5ZXJzOiBmdW5jdGlvbiAoUGxheWVyTWFuYWdlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBQbGF5ZXJNYW5hZ2VyLmluaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRoOiBmdW5jdGlvbiAoQXV0aFJlc29sdmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhSZXNvbHZlci5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnOiBmdW5jdGlvbiAoQ29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIENvbmZpZy5pbml0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdkYXNoYm9hcmQnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9kYXNoYm9hcmQnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2Rhc2hib2FyZC5odG1sJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0Rhc2hib2FyZENvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICdjdHJsJyxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50OiAnbWFpbicsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vYXV0aG9yaXplZFJvbGVzOiBbVVNFUl9ST0xFUy5hZG1pbiwgVVNFUl9ST0xFUy5wbGF5ZXJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgdWk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWN0aW9uOiAnZGFzaGJvYXJkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnc3RhdHMnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9zdGF0cycsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvc3RhdHMuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTdGF0c0NvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICdjdHJsJyxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50OiAnbWFpbicsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vYXV0aG9yaXplZFJvbGVzOiBbVVNFUl9ST0xFUy5hZG1pbiwgVVNFUl9ST0xFUy5wbGF5ZXJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgdWk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWN0aW9uOiAnc3RhdHMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhZGQnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9hZGQnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2VkaXQtbWF0Y2guaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdFZGl0TWF0Y2hDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiAnY3RybCcsXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogJ21haW4nLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2F1dGhvcml6ZWRSb2xlczogW1VTRVJfUk9MRVMuYWRtaW4sIFVTRVJfUk9MRVMucGxheWVyXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVpOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQnV0dG9uOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrQnV0dG9uOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdlZGl0Jywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvZWRpdC86bWF0Y2hJZCcsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvZWRpdC1tYXRjaC5odG1sJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0VkaXRNYXRjaENvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICdjdHJsJyxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50OiAnbWFpbicsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vYXV0aG9yaXplZFJvbGVzOiBbVVNFUl9ST0xFUy5hZG1pbiwgVVNFUl9ST0xFUy5wbGF5ZXJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgdWk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRCdXR0b246IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tCdXR0b246IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAkbWRJY29uUHJvdmlkZXJcbiAgICAgICAgICAgICAgICAuZGVmYXVsdEZvbnRTZXQoJ21hdGVyaWFsLWljb25zJyk7XG5cbiAgICAgICAgICAgICRtZFRoZW1pbmdQcm92aWRlci50aGVtZSgnZGVmYXVsdCcpXG4gICAgICAgICAgICAgICAgLnByaW1hcnlQYWxldHRlKCd0ZWFsJylcbiAgICAgICAgICAgICAgICAuYWNjZW50UGFsZXR0ZSgnbGltZScpXG4gICAgICAgICAgICAgICAgLndhcm5QYWxldHRlKCdkZWVwLW9yYW5nZScpXG4gICAgICAgICAgICAgICAgLmJhY2tncm91bmRQYWxldHRlKCdncmV5Jyk7XG5cbiAgICAgICAgICAgIENoYXJ0SnNQcm92aWRlci5zZXRPcHRpb25zKCdMaW5lJywge1xuICAgICAgICAgICAgICAgIHNjYWxlU2hvd1ZlcnRpY2FsTGluZXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1haW50YWluQXNwZWN0UmF0aW86IGZhbHNlLFxuICAgICAgICAgICAgICAgIGRhdGFzZXRGaWxsOiBmYWxzZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICRtZERhdGVMb2NhbGVQcm92aWRlci5tb250aHMgPSBbJ2phbnZpZXInLCAnZsOpdnJpZXInLCAnbWFycycsICdhdnJpbCcsICdtYWknLCAnanVpbicsICdqdWlsbGV0JywgJ2Fvw7t0JywgJ3NlcHRlbWJyZScsICdvY3RvYnJlJywgJ25vdmVtYnJlJywgJ2TDqWNlbWJyZSddO1xuICAgICAgICAgICAgJG1kRGF0ZUxvY2FsZVByb3ZpZGVyLnNob3J0TW9udGhzID0gWydqYW52LicsICdmw6l2ci4nLCAnbWFycycsICdhdnJpbCcsICdtYWknLCAnanVpbicsICdqdWlsLicsICdhb8O7dCcsICdzZXB0LicsICdvY3QuJywgJ25vdi4nLCAnZMOpYy4nXTtcbiAgICAgICAgICAgICRtZERhdGVMb2NhbGVQcm92aWRlci5kYXlzID0gWydkaW1hbmNoZScsICdsdW5kaScsICdtYXJkaScsICdtZXJjcmVkaScsICdqZXVkaScsICd2ZW5kcmVkaScsICdzYW1lZGknXTtcbiAgICAgICAgICAgICRtZERhdGVMb2NhbGVQcm92aWRlci5zaG9ydERheXMgPSBbJ0RpJywgJ0x1JywgJ01hJywgJ01lJywgJ0plJywgJ1ZlJywgJ1NhJ107XG4gICAgICAgICAgICAkbWREYXRlTG9jYWxlUHJvdmlkZXIuZmlyc3REYXlPZldlZWsgPSAxO1xuICAgICAgICAgICAgJG1kRGF0ZUxvY2FsZVByb3ZpZGVyLmZvcm1hdERhdGUgPSBmdW5jdGlvbihkYXRlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vbWVudChkYXRlKS5mb3JtYXQoJ0RELk1NLllZWVknKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAkbWREYXRlTG9jYWxlUHJvdmlkZXIubXNnQ2FsZW5kYXIgPSAnQ2FsZW5kcmllcic7XG4gICAgICAgICAgICAkbWREYXRlTG9jYWxlUHJvdmlkZXIubXNnT3BlbkNhbGVuZGFyID0gJ091dnJpciBsZSBjYWxlbmRyaWVyJztcblxuICAgICAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH1cbiAgICBdKVxuICAgIC5ydW4oW1xuICAgICAgICAnJHJvb3RTY29wZScsXG4gICAgICAgICdhbU1vbWVudCcsXG4gICAgICAgICdBdXRoJyxcbiAgICAgICAgJ0FVVEhfRVZFTlRTJyxcbiAgICAgICAgJyRzdGF0ZScsXG5cbiAgICAgICAgZnVuY3Rpb24gKCRyb290U2NvcGUsIGFtTW9tZW50LCBBdXRoLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG4gICAgICAgICAgICBhbU1vbWVudC5jaGFuZ2VMb2NhbGUoJ2ZyJyk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFBhZ2UgPSB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdHM6IHt9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLnNlcnZlcklzT25saW5lID0gdHJ1ZTtcbiAgICAgICAgICAgICRyb290U2NvcGUudGFza3MgPSB7fTtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCBuZXh0KSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1dGhvcml6ZWRSb2xlcyA9IG5leHQuZGF0YSAmJiBuZXh0LmRhdGEuYXV0aG9yaXplZFJvbGVzO1xuICAgICAgICAgICAgICAgIGlmIChhdXRob3JpemVkUm9sZXMgJiYgIUF1dGguaXNBdXRob3JpemVkKGF1dGhvcml6ZWRSb2xlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEF1dGguaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVzZXIgaXMgbm90IGFsbG93ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVzZXIgaXMgbm90IGxvZ2dlZCBpblxuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG5leHQubmFtZSA9PSAnbG9naW4nICYmIEF1dGguaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdkYXNoYm9hcmQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5GYWlsZWQsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgXSk7XG5cbmFuZ3VsYXIubW9kdWxlKCdzY29yZUFwcC5jb250cm9sbGVycycsIFtdKTtcbmFuZ3VsYXIubW9kdWxlKCdzY29yZUFwcC5zZXJ2aWNlcycsIFtdKTtcbmFuZ3VsYXIubW9kdWxlKCdzY29yZUFwcC5kaXJlY3RpdmVzJywgW10pO1xuXG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL0FwcENvbnRyb2xsZXInKTtcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvRGFzaGJvYXJkQ29udHJvbGxlcicpO1xucmVxdWlyZSgnLi9jb250cm9sbGVycy9FZGl0TWF0Y2hDb250cm9sbGVyJyk7XG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL0xvZ2luQ29udHJvbGxlcicpO1xucmVxdWlyZSgnLi9jb250cm9sbGVycy9NYXRjaENvbnRyb2xsZXInKTtcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvU3RhdHNDb250cm9sbGVyJyk7XG5cbnJlcXVpcmUoJy4vbW9kZWxzL01hdGNoJyk7XG5yZXF1aXJlKCcuL21vZGVscy9QbGF5ZXInKTtcbnJlcXVpcmUoJy4vbW9kZWxzL1VzZXInKTtcblxucmVxdWlyZSgnLi9zZXJ2aWNlcy9BdXRoJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2VzL0F1dGhJbnRlcmNlcHRvcicpO1xucmVxdWlyZSgnLi9zZXJ2aWNlcy9BdXRoUmVzb2x2ZXInKTtcbnJlcXVpcmUoJy4vc2VydmljZXMvQ29uZmlnJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2VzL1BsYXllck1hbmFnZXInKTtcbnJlcXVpcmUoJy4vc2VydmljZXMvU3RhdGlzdGljJyk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5jb250cm9sbGVycycpXG4gICAgICAgIC5jb250cm9sbGVyKCdBcHBDb250cm9sbGVyJywgQXBwQ29udHJvbGxlcik7XG5cbiAgICBmdW5jdGlvbiBBcHBDb250cm9sbGVyICgkbWRTaWRlbmF2LCAkcm9vdFNjb3BlLCBBdXRoLCAkc2NvcGUsICRzdGF0ZSwgVVNFUl9ST0xFUykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdmFyIF9kZWZhdWx0VUkgPSB7XG4gICAgICAgICAgICBzZWN0aW9uOiBudWxsLFxuICAgICAgICAgICAgYWRkQnV0dG9uOiB0cnVlLFxuICAgICAgICAgICAgYmFja0J1dHRvbjogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYudWkgPSBhbmd1bGFyLmV4dGVuZCh7fSwgX2RlZmF1bHRVSSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUpe1xuICAgICAgICAgICAgaWYgKHRvU3RhdGUuZGF0YSkge1xuICAgICAgICAgICAgICAgIHNlbGYudWkgPSBhbmd1bGFyLmV4dGVuZCh7fSwgX2RlZmF1bHRVSSwgdG9TdGF0ZS5kYXRhLnVpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi51aSA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCBfZGVmYXVsdFVJKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2VsZi5jbG9zZU1lbnUgPSBjbG9zZU1lbnU7XG4gICAgICAgIHNlbGYudG9nZ2xlTWVudSA9IHRvZ2dsZU1lbnU7XG4gICAgICAgIHNlbGYubG9nb3V0ID0gbG9nb3V0O1xuXG4gICAgICAgICRzY29wZS51c2VyUm9sZXMgPSBVU0VSX1JPTEVTO1xuICAgICAgICAkc2NvcGUuaXNBdXRob3JpemVkID0gQXV0aC5pc0F1dGhvcml6ZWQ7XG5cbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlTWVudSgpIHtcbiAgICAgICAgICAgICRtZFNpZGVuYXYoJ2xlZnQnKS50b2dnbGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNsb3NlTWVudSgpIHtcbiAgICAgICAgICAgICRtZFNpZGVuYXYoJ2xlZnQnKS5jbG9zZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gbG9nb3V0KCkge1xuICAgICAgICAgICAgQXV0aC5sb2dvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2V0Q3VycmVudFVzZXIobnVsbCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICB9XG5cbiAgICAgICAgQXV0aC5sb2dpbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRDdXJyZW50VXNlcihBdXRoLnVzZXIpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuc2V0Q3VycmVudFVzZXIgPSBmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IHVzZXI7XG4gICAgICAgIH07XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ3Njb3JlQXBwLmNvbnRyb2xsZXJzJylcbiAgICAgICAgLmNvbnRyb2xsZXIoJ0Rhc2hib2FyZENvbnRyb2xsZXInLCBEYXNoYm9hcmRDb250cm9sbGVyKTtcblxuICAgIGZ1bmN0aW9uIERhc2hib2FyZENvbnRyb2xsZXIgKE1hdGNoLCAkbWRNZWRpYSwgJG1kRGlhbG9nLCAkc2NvcGUsIFBsYXllck1hbmFnZXIpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYubWF0Y2hlcyA9IHt9O1xuICAgICAgICBzZWxmLmxvYWRpbmdQcm9taXNlID0ge307XG4gICAgICAgIHNlbGYudG90YWxDb3VudCA9IDA7XG4gICAgICAgIHNlbGYucGxheWVyTmFtZXMgPSBQbGF5ZXJNYW5hZ2VyLm5hbWVzO1xuICAgICAgICBzZWxmLmdldE1hdGNoZXMgPSBnZXRNYXRjaGVzO1xuICAgICAgICBzZWxmLnNob3dNYXRjaERldGFpbCA9IHNob3dNYXRjaERldGFpbDtcbiAgICAgICAgc2VsZi5mdWxsc2NyZWVuTW9kYWwgPSAkbWRNZWRpYSgneHMnKTtcblxuICAgICAgICBzZWxmLnF1ZXJ5ID0ge1xuICAgICAgICAgICAgbGltaXQ6IDIwLFxuICAgICAgICAgICAgcGFnZTogMVxuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIGdldE1hdGNoZXMoKSB7XG4gICAgICAgICAgICBzZWxmLmxvYWRpbmdQcm9taXNlID0gTWF0Y2gucXVlcnkoc2VsZi5xdWVyeSkuJHByb21pc2U7XG5cbiAgICAgICAgICAgIHNlbGYubG9hZGluZ1Byb21pc2UudGhlbihmdW5jdGlvbihtYXRjaGVzKXtcbiAgICAgICAgICAgICAgICBzZWxmLm1hdGNoZXMgPSBtYXRjaGVzO1xuICAgICAgICAgICAgICAgIHNlbGYudG90YWxDb3VudCA9IE1hdGNoLnRvdGFsQ291bnQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNob3dNYXRjaERldGFpbChtYXRjaElkLCBldikge1xuICAgICAgICAgICAgdmFyIHVzZUZ1bGxTY3JlZW4gPSAkbWRNZWRpYSgneHMnKSAmJiBzZWxmLmZ1bGxzY3JlZW5Nb2RhbDtcblxuICAgICAgICAgICAgJG1kRGlhbG9nLnNob3coe1xuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnTWF0Y2hDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiAnY3RybCcsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbWF0Y2guaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmJvZHkpLFxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRFdmVudDogZXYsXG4gICAgICAgICAgICAgICAgICAgIGNsaWNrT3V0c2lkZVRvQ2xvc2U6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGZ1bGxzY3JlZW46IHVzZUZ1bGxTY3JlZW4sXG4gICAgICAgICAgICAgICAgICAgIGxvY2Fsczoge21hdGNoSWQ6IG1hdGNoSWR9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRtZE1lZGlhKCd4cycpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24od2FudHNGdWxsU2NyZWVuKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5mdWxsc2NyZWVuTW9kYWwgPSAod2FudHNGdWxsU2NyZWVuID09PSB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0TWF0Y2hlcygpO1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5jb250cm9sbGVycycpXG4gICAgICAgIC5jb250cm9sbGVyKCdFZGl0TWF0Y2hDb250cm9sbGVyJywgRWRpdE1hdGNoQ29udHJvbGxlcik7XG5cbiAgICBmdW5jdGlvbiBFZGl0TWF0Y2hDb250cm9sbGVyIChNYXRjaCwgUGxheWVyTWFuYWdlciwgJG1kVG9hc3QsICRtZERpYWxvZywgJHN0YXRlUGFyYW1zLCAkc3RhdGUpe1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi5wbGF5ZXJzID0gW107XG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChQbGF5ZXJNYW5hZ2VyLnBsYXllcnMsIGZ1bmN0aW9uKHBsYXllcikge1xuICAgICAgICAgICAgc2VsZi5wbGF5ZXJzLnB1c2gocGxheWVyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2VsZi5tYXRjaCA9IHtcbiAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICB0ZWFtMToge1xuICAgICAgICAgICAgICAgIHBsYXllcnM6IFtcbiAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbnVsbFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgcG9pbnRzOiBudWxsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVhbTI6IHtcbiAgICAgICAgICAgICAgICBwbGF5ZXJzOiBbXG4gICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG51bGxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIHBvaW50czogbnVsbFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhbGxzOiAxLFxuICAgICAgICAgICAgY29tbWVudHM6IG51bGxcbiAgICAgICAgfTtcbiAgICAgICAgc2VsZi5xdWVyeVNlYXJjaCA9IHF1ZXJ5U2VhcmNoO1xuICAgICAgICBzZWxmLmVkaXRNb2RlID0gZmFsc2U7XG4gICAgICAgIHNlbGYuaXNTYXZpbmcgPSBmYWxzZTtcbiAgICAgICAgc2VsZi5zZWxlY3RQbGF5ZXIgPSBzZWxlY3RQbGF5ZXI7XG4gICAgICAgIHNlbGYuc2F2ZSA9IHNhdmU7XG4gICAgICAgIHNlbGYucmVtb3ZlTWF0Y2ggPSByZW1vdmVNYXRjaDtcblxuICAgICAgICBpZiAoJHN0YXRlUGFyYW1zLm1hdGNoSWQpIHtcbiAgICAgICAgICAgIE1hdGNoLmdldCh7aWQ6ICRzdGF0ZVBhcmFtcy5tYXRjaElkfSwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBtYXRjaC5kYXRlID0gbmV3IERhdGUobWF0Y2guZGF0ZSk7XG4gICAgICAgICAgICAgICAgbWF0Y2gudGVhbTEucGxheWVycyA9IG1hdGNoLnRlYW0xLnBsYXllcnMubWFwKGZ1bmN0aW9uKHBsYXllcklkKXsgcmV0dXJuIFBsYXllck1hbmFnZXIucGxheWVyc1twbGF5ZXJJZF0gfSk7XG4gICAgICAgICAgICAgICAgbWF0Y2gudGVhbTIucGxheWVycyA9IG1hdGNoLnRlYW0yLnBsYXllcnMubWFwKGZ1bmN0aW9uKHBsYXllcklkKXsgcmV0dXJuIFBsYXllck1hbmFnZXIucGxheWVyc1twbGF5ZXJJZF0gfSk7XG4gICAgICAgICAgICAgICAgc2VsZi5tYXRjaCA9IG1hdGNoO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHNlbGYuZWRpdE1vZGUgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2VsZWN0UGxheWVyKHRlYW0sIHBsYXllckluZGV4LCBwbGF5ZXIpIHtcbiAgICAgICAgICAgIHNlbGYubWF0Y2hGb3JtLnRlYW0xUGxheWVyMi4kc2V0VmFsaWRpdHkoXCJ1bmlxdWVUZWFtUGxheWVyXCIsIHZhbGlkYXRlVGVhbVBsYXllcihzZWxmLm1hdGNoLnRlYW0xKSk7XG4gICAgICAgICAgICBzZWxmLm1hdGNoRm9ybS50ZWFtMlBsYXllcjIuJHNldFZhbGlkaXR5KFwidW5pcXVlVGVhbVBsYXllclwiLCB2YWxpZGF0ZVRlYW1QbGF5ZXIoc2VsZi5tYXRjaC50ZWFtMikpO1xuXG4gICAgICAgICAgICBzZWxmLm1hdGNoRm9ybS50ZWFtMlBsYXllcjEuJHNldFZhbGlkaXR5KFwidW5pcXVlUGxheWVyXCIsIHZhbGlkYXRlVW5pcXVlUGxheWVyKHNlbGYubWF0Y2gudGVhbTIsIDApKTtcbiAgICAgICAgICAgIHNlbGYubWF0Y2hGb3JtLnRlYW0yUGxheWVyMi4kc2V0VmFsaWRpdHkoXCJ1bmlxdWVQbGF5ZXJcIiwgdmFsaWRhdGVVbmlxdWVQbGF5ZXIoc2VsZi5tYXRjaC50ZWFtMiwgMSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcXVlcnlTZWFyY2gocXVlcnksIGN1cnJlbnRTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZFBsYXllcnMgPSBbXS5jb25jYXQoc2VsZi5tYXRjaC50ZWFtMS5wbGF5ZXJzLCBzZWxmLm1hdGNoLnRlYW0yLnBsYXllcnMpO1xuXG4gICAgICAgICAgICAvLyBSZW1vdmUgY3VycmVudCBzZWxlY3Rpb24gZnJvbSBzZWxlY3RlZCBwbGF5ZXJzXG4gICAgICAgICAgICBpZiAoY3VycmVudFNlbGVjdGlvbiAmJiBzZWxlY3RlZFBsYXllcnMuaW5kZXhPZihjdXJyZW50U2VsZWN0aW9uKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRQbGF5ZXJzLnNwbGljZShzZWxlY3RlZFBsYXllcnMuaW5kZXhPZihjdXJyZW50U2VsZWN0aW9uKSwgMSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhdmFpbGFibGVQbGF5ZXJzID0gcXVlcnkgPyBzZWxmLnBsYXllcnMuZmlsdGVyKCBjcmVhdGVGaWx0ZXJGb3IocXVlcnkpICkgOiBbXS5jb25jYXQoc2VsZi5wbGF5ZXJzKTtcblxuICAgICAgICAgICAgLy8gUmVtb3ZlIGFscmVhZHkgc2VsZWN0ZWQgcGxheWVycyBmcm9tIGF2YWlsYWJsZSBwbGF5ZXJzIChleGNlcHQgY3VycmVudCBzZWxlY3Rpb24pXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VsZWN0ZWRQbGF5ZXJzLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gYXZhaWxhYmxlUGxheWVycy5pbmRleE9mKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVQbGF5ZXJzLnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBhdmFpbGFibGVQbGF5ZXJzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlRmlsdGVyRm9yKHF1ZXJ5KSB7XG4gICAgICAgICAgICB2YXIgbG93ZXJjYXNlUXVlcnkgPSBhbmd1bGFyLmxvd2VyY2FzZShxdWVyeSk7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gZmlsdGVyRm4ocGxheWVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChhbmd1bGFyLmxvd2VyY2FzZShwbGF5ZXIubmFtZSkuaW5kZXhPZihsb3dlcmNhc2VRdWVyeSkgPT09IDApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIHRoYXQgYSBwbGF5ZXIgaXMgb25seSBzZWxlY3RlZCBvbmNlIGluIGEgdGVhbVxuICAgICAgICBmdW5jdGlvbiB2YWxpZGF0ZVRlYW1QbGF5ZXIodGVhbSkge1xuICAgICAgICAgICAgaWYgKHRlYW0ucGxheWVycy5sZW5ndGggPT0gMikge1xuICAgICAgICAgICAgICAgIGlmICh0ZWFtLnBsYXllcnNbMF0gPT0gdGVhbS5wbGF5ZXJzWzFdICYmIHRlYW0ucGxheWVyc1swXSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIHRoYXQgZWFjaCBwbGF5ZXIgaXMgb25seSBzZWxlY3RlZCBvbmNlIGZvciB0aGUgbWF0Y2hcbiAgICAgICAgZnVuY3Rpb24gdmFsaWRhdGVVbmlxdWVQbGF5ZXIodGVhbSwgcGxheWVySW5kZXgpIHtcbiAgICAgICAgICAgIGlmICghdGVhbS5wbGF5ZXJzW3BsYXllckluZGV4XSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgb3Bwb25lbnRzO1xuICAgICAgICAgICAgaWYgKHRlYW0ucGxheWVycyA9PSBzZWxmLm1hdGNoLnRlYW0yLnBsYXllcnMpIHtcbiAgICAgICAgICAgICAgICBvcHBvbmVudHMgPSBzZWxmLm1hdGNoLnRlYW0xLnBsYXllcnM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9wcG9uZW50cyA9IHNlbGYubWF0Y2gudGVhbTIucGxheWVycztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGR1cGxpY2F0ZSBwbGF5ZXIgaW4gb3Bwb25lbnQgdGVhbVxuICAgICAgICAgICAgcmV0dXJuIG9wcG9uZW50cy5pbmRleE9mKHRlYW0ucGxheWVyc1twbGF5ZXJJbmRleF0pIDwgMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNhdmUoKSB7XG4gICAgICAgICAgICBzZWxmLmlzU2F2aW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgdmFyIHN1Y2Nlc3NDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRtZFRvYXN0LnNob3coXG4gICAgICAgICAgICAgICAgICAgICRtZFRvYXN0LnNpbXBsZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGV4dENvbnRlbnQoJ01hdGNoIGVucmVnaXN0csOpJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5wb3NpdGlvbigndG9wIHJpZ2h0JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5oaWRlRGVsYXkoMzAwMClcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgc2VsZi5pc1NhdmluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdkYXNoYm9hcmQnKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgZXJyb3JDYWxsYmFjayA9IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5pc1NhdmluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgdmFyIGVycm9yTWVzc2FnZSA9IFwiZXJyZXVyIHNlcnZldXJcIjtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YS5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSByZXNwb25zZS5kYXRhLmVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgJG1kRGlhbG9nLnNob3coXG4gICAgICAgICAgICAgICAgICAgICRtZERpYWxvZy5hbGVydCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY2xpY2tPdXRzaWRlVG9DbG9zZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRpdGxlKCdFcnJldXInKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRleHRDb250ZW50KCdMYSBzYXV2ZWdhcmRlIGEgw6ljaG91w6llICgnICsgZXJyb3JNZXNzYWdlICsgJyknKVxuICAgICAgICAgICAgICAgICAgICAgICAgLm9rKCdPSycpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBtYXRjaDtcblxuICAgICAgICAgICAgaWYgKHNlbGYuZWRpdE1vZGUpIHtcbiAgICAgICAgICAgICAgICBtYXRjaCA9IHNlbGYubWF0Y2g7XG5cbiAgICAgICAgICAgICAgICBtYXRjaC50ZWFtMS5wbGF5ZXJzID0gbWF0Y2gudGVhbTEucGxheWVycy5tYXAoZnVuY3Rpb24ocGxheWVyKXsgcmV0dXJuIHBsYXllci5faWQgfSk7XG4gICAgICAgICAgICAgICAgbWF0Y2gudGVhbTIucGxheWVycyA9IG1hdGNoLnRlYW0yLnBsYXllcnMubWFwKGZ1bmN0aW9uKHBsYXllcil7IHJldHVybiBwbGF5ZXIuX2lkIH0pO1xuXG4gICAgICAgICAgICAgICAgTWF0Y2gudXBkYXRlKG1hdGNoLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtYXRjaCA9IG5ldyBNYXRjaCgpO1xuXG4gICAgICAgICAgICAgICAgbWF0Y2guZGF0ZSA9IHNlbGYubWF0Y2guZGF0ZTtcbiAgICAgICAgICAgICAgICBtYXRjaC50ZWFtMSA9IHNlbGYubWF0Y2gudGVhbTE7XG4gICAgICAgICAgICAgICAgbWF0Y2gudGVhbTIgPSBzZWxmLm1hdGNoLnRlYW0yO1xuICAgICAgICAgICAgICAgIG1hdGNoLmJhbGxzID0gc2VsZi5tYXRjaC5iYWxscztcbiAgICAgICAgICAgICAgICBtYXRjaC5jb21tZW50cyA9IHNlbGYubWF0Y2guY29tbWVudHM7XG5cbiAgICAgICAgICAgICAgICBtYXRjaC50ZWFtMS5wbGF5ZXJzID0gbWF0Y2gudGVhbTEucGxheWVycy5tYXAoZnVuY3Rpb24ocGxheWVyKXsgcmV0dXJuIHBsYXllci5faWQgfSk7XG4gICAgICAgICAgICAgICAgbWF0Y2gudGVhbTIucGxheWVycyA9IG1hdGNoLnRlYW0yLnBsYXllcnMubWFwKGZ1bmN0aW9uKHBsYXllcil7IHJldHVybiBwbGF5ZXIuX2lkIH0pO1xuXG4gICAgICAgICAgICAgICAgTWF0Y2guc2F2ZShtYXRjaCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZU1hdGNoKCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpcm0oXCJWb3VsZXotdm91cyB2cmFpbWVudCBzdXBwcmltZXIgY2UgbWF0Y2g/XCIpKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5pc1NhdmluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBNYXRjaC5kZWxldGUoe2lkOiBzZWxmLm1hdGNoLl9pZH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJG1kVG9hc3Quc2hvdyhcbiAgICAgICAgICAgICAgICAgICAgICAgICRtZFRvYXN0LnNpbXBsZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHRDb250ZW50KCdNYXRjaCBzdXBwcmltw6knKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vLmFjdGlvbignQU5OVUxFUicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmhpZ2hsaWdodEFjdGlvbih0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3NpdGlvbigndG9wIHJpZ2h0JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuaGlkZURlbGF5KDMwMDApXG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pc1NhdmluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnZGFzaGJvYXJkJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnc2NvcmVBcHAuY29udHJvbGxlcnMnKVxuICAgICAgICAuY29udHJvbGxlcignTG9naW5Db250cm9sbGVyJywgTG9naW5Db250cm9sbGVyKTtcblxuICAgIGZ1bmN0aW9uIExvZ2luQ29udHJvbGxlciAoY29uZmlnKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLmdyb3VwTmFtZSA9IGNvbmZpZy5ncm91cC5uYW1lO1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5jb250cm9sbGVycycpXG4gICAgICAgIC5jb250cm9sbGVyKCdNYXRjaENvbnRyb2xsZXInLCBNYXRjaENvbnRyb2xsZXIpO1xuXG4gICAgZnVuY3Rpb24gTWF0Y2hDb250cm9sbGVyIChNYXRjaCwgbWF0Y2hJZCwgJG1kRGlhbG9nLCAkc3RhdGUsIFBsYXllck1hbmFnZXIpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYubWF0Y2ggPSB7fTtcbiAgICAgICAgc2VsZi5wbGF5ZXJOYW1lcyA9IFBsYXllck1hbmFnZXIubmFtZXM7XG4gICAgICAgIHNlbGYuZWRpdE1hdGNoID0gZWRpdE1hdGNoO1xuICAgICAgICBzZWxmLmNsb3NlID0gY2xvc2U7XG5cbiAgICAgICAgTWF0Y2guZ2V0KHtpZDogbWF0Y2hJZH0sIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgICAgICBzZWxmLm1hdGNoID0gbWF0Y2g7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgICAgICAgICAgJG1kRGlhbG9nLmNhbmNlbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZWRpdE1hdGNoKG1hdGNoSWQpIHtcbiAgICAgICAgICAgICRtZERpYWxvZy5jYW5jZWwoKTtcblxuICAgICAgICAgICAgJHN0YXRlLmdvKCdlZGl0Jywge21hdGNoSWQ6IG1hdGNoSWR9KTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5jb250cm9sbGVycycpXG4gICAgICAgIC5jb250cm9sbGVyKCdTdGF0c0NvbnRyb2xsZXInLCBTdGF0c0NvbnRyb2xsZXIpO1xuXG4gICAgZnVuY3Rpb24gU3RhdHNDb250cm9sbGVyIChQbGF5ZXJNYW5hZ2VyLCBTdGF0aXN0aWMsIG1vbWVudCwgUEVSSU9EUyl7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnBsYXllckNvbG9ycyA9IFBsYXllck1hbmFnZXIuY29sb3JzO1xuICAgICAgICBzZWxmLnBsYXllck5hbWVzID0gUGxheWVyTWFuYWdlci5uYW1lcztcbiAgICAgICAgc2VsZi5wZXJpb2RzID0gW1xuICAgICAgICAgICAge3ZhbHVlOiBQRVJJT0RTLldFRUssIG5hbWU6ICc3IGpvdXJzJ30sXG4gICAgICAgICAgICB7dmFsdWU6IFBFUklPRFMuVFdPV0VFSywgbmFtZTogJzE0IGpvdXJzJ30sXG4gICAgICAgICAgICB7dmFsdWU6IFBFUklPRFMuTU9OVEgsIG5hbWU6ICczMCBqb3Vycyd9LFxuICAgICAgICAgICAgLy97dmFsdWU6IFBFUklPRFMuUVVBUlRFUiwgbmFtZTogJzMgbW9pcyd9XG4gICAgICAgIF07XG5cbiAgICAgICAgc2VsZi5zZWxlY3RlZFBlcmlvZCA9IFBFUklPRFMuTU9OVEg7XG4gICAgICAgIHZhciBfZGF0ZVJhbmdlID0gU3RhdGlzdGljLmdldERhdGVSYW5nZUZvclBlcmlvZChzZWxmLnNlbGVjdGVkUGVyaW9kKTtcblxuICAgICAgICBzZWxmLmNoYXJ0T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGFuaW1hdGlvbjogZmFsc2UsXG4gICAgICAgICAgICBzY2FsZU92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgc2NhbGVTdGVwczogMTAsXG4gICAgICAgICAgICBzY2FsZVN0ZXBXaWR0aDogMTAsXG4gICAgICAgICAgICBzY2FsZVN0YXJ0VmFsdWU6IDAsXG4gICAgICAgICAgICBiZXppZXJDdXJ2ZTogZmFsc2UsXG4gICAgICAgICAgICBwb2ludEhpdERldGVjdGlvblJhZGl1cyA6IDEwLFxuICAgICAgICAgICAgLy9wb2ludERvdDogZmFsc2UsXG4gICAgICAgICAgICB0b29sdGlwVGVtcGxhdGU6IFwiPCVpZiAobGFiZWwpeyU+PCU9bGFiZWwlPiA6IDwlfSU+PCU9IHZhbHVlICU+ICVcIlxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYucGVyaW9kU3RhdHMgPSB7XG4gICAgICAgICAgICBkdW86IHtcbiAgICAgICAgICAgICAgICBsZWFkZXJib2FyZDogW10sXG4gICAgICAgICAgICAgICAgY2hhcnREYXRhOiB7fVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNvbG86IHtcbiAgICAgICAgICAgICAgICBsZWFkZXJib2FyZDogW10sXG4gICAgICAgICAgICAgICAgY2hhcnREYXRhOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuc2V0U2VsZWN0ZWRQZXJpb2QgPSBzZXRTZWxlY3RlZFBlcmlvZDtcblxuICAgICAgICBmdW5jdGlvbiBzZXRTZWxlY3RlZFBlcmlvZChzZWxlY3RlZFBlcmlvZCkge1xuICAgICAgICAgICAgc2VsZi5zZWxlY3RlZFBlcmlvZCA9IHNlbGVjdGVkUGVyaW9kO1xuICAgICAgICAgICAgX2RhdGVSYW5nZSA9IFN0YXRpc3RpYy5nZXREYXRlUmFuZ2VGb3JQZXJpb2Qoc2VsZWN0ZWRQZXJpb2QpO1xuXG4gICAgICAgICAgICBmZXRjaFN0YXRpc3RpY3NGb3JEYXRlUmFuZ2UoX2RhdGVSYW5nZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBmZXRjaFN0YXRpc3RpY3NGb3JEYXRlUmFuZ2UoZGF0ZVJhbmdlKSB7XG4gICAgICAgICAgICBTdGF0aXN0aWMuZ2V0V2lubmluZ1BlcmNlbnRhZ2VzRm9yRGF0ZVJhbmdlKGRhdGVSYW5nZSkudGhlbihmdW5jdGlvbihwZXJpb2RQZXJjZW50YWdlcyl7XG4gICAgICAgICAgICAgICAgdmFyIGxlYWRlcmJvYXJkcyA9IFN0YXRpc3RpYy5jcmVhdGVMZWFkZXJib2FyZHNGcm9tV2lubmluZ1BlcmNlbnRhZ2VzKHBlcmlvZFBlcmNlbnRhZ2VzKTtcbiAgICAgICAgICAgICAgICBzZWxmLnBlcmlvZFN0YXRzLnNvbG8ubGVhZGVyYm9hcmQgPSBsZWFkZXJib2FyZHMuc29sbztcbiAgICAgICAgICAgICAgICBzZWxmLnBlcmlvZFN0YXRzLmR1by5sZWFkZXJib2FyZCA9IGxlYWRlcmJvYXJkcy5kdW87XG5cbiAgICAgICAgICAgICAgICBzZWxmLnBlcmlvZFN0YXRzLnNvbG8uY2hhcnREYXRhID0gYW5ndWxhci5leHRlbmQoXG4gICAgICAgICAgICAgICAgICAgIHNlbGYucGVyaW9kU3RhdHMuc29sby5jaGFydERhdGEsIGNyZWF0ZUNoYXJ0RGF0YShwZXJpb2RQZXJjZW50YWdlcy5zb2xvKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgc2VsZi5wZXJpb2RTdGF0cy5kdW8uY2hhcnREYXRhID0gYW5ndWxhci5leHRlbmQoXG4gICAgICAgICAgICAgICAgICAgIHNlbGYucGVyaW9kU3RhdHMuZHVvLmNoYXJ0RGF0YSwgY3JlYXRlQ2hhcnREYXRhKHBlcmlvZFBlcmNlbnRhZ2VzLmR1bylcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVMYWJlbHNGb3JJbnRlcnZhbChzdGFydERhdGUsIGVuZERhdGUpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50RGF0ZSA9IG1vbWVudChzdGFydERhdGUpO1xuICAgICAgICAgICAgdmFyIGxhYmVscyA9IFtdO1xuXG4gICAgICAgICAgICB3aGlsZSAoY3VycmVudERhdGUudG9EYXRlKCkgPD0gZW5kRGF0ZSkge1xuICAgICAgICAgICAgICAgIGxhYmVscy5wdXNoKGN1cnJlbnREYXRlLmZvcm1hdCgnRCBNTU0nKSk7XG5cbiAgICAgICAgICAgICAgICBjdXJyZW50RGF0ZSA9IGN1cnJlbnREYXRlLmFkZCgxLCAnZCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbGFiZWxzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlQ2hhcnRTZXJpZXMocGxheWVyUGVyY2VudGFnZXMpIHtcbiAgICAgICAgICAgIHZhciBzZXJpZXMgPSB7fTtcblxuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHBsYXllclBlcmNlbnRhZ2VzLCBmdW5jdGlvbiAoZGF5U3RhdHMpIHtcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZGF5U3RhdHMucGVyY2VudGFnZXMsIGZ1bmN0aW9uIChwbGF5ZXJTdGF0cykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXNlcmllc1twbGF5ZXJTdGF0cy5wbGF5ZXJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJpZXNbcGxheWVyU3RhdHMucGxheWVyXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgc2VyaWVzW3BsYXllclN0YXRzLnBsYXllcl0ucHVzaChNYXRoLnJvdW5kKHBsYXllclN0YXRzLndpblBlcmNlbnQgKiAxMDAwMCkgLyAxMDApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBzZXJpZXM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVDaGFydERhdGEocGxheWVyUGVyY2VudGFnZXMpIHtcbiAgICAgICAgICAgIHZhciBzZXJpZXMgPSBjcmVhdGVDaGFydFNlcmllcyhwbGF5ZXJQZXJjZW50YWdlcyk7XG5cbiAgICAgICAgICAgIHZhciBnZXRQbGF5ZXJOYW1lID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5wbGF5ZXJOYW1lc1tpZF07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNlcmllczogT2JqZWN0LmtleXMoc2VyaWVzKS5tYXAoZ2V0UGxheWVyTmFtZSksXG4gICAgICAgICAgICAgICAgZGF0YTogZXh0cmFjdFNlcmllc0RhdGEoc2VyaWVzKSxcbiAgICAgICAgICAgICAgICBjb2xvcnM6IGdldENvbG9yc0ZvclNlcmllcyhzZXJpZXMpLFxuICAgICAgICAgICAgICAgIGxhYmVsczogY3JlYXRlTGFiZWxzRm9ySW50ZXJ2YWwoX2RhdGVSYW5nZS5zdGFydERhdGUsIF9kYXRlUmFuZ2UuZW5kRGF0ZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBleHRyYWN0U2VyaWVzRGF0YShzZXJpZXMpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gW107XG5cbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZXJpZXMsIGZ1bmN0aW9uIChzZXJpZSkge1xuICAgICAgICAgICAgICAgIGRhdGEucHVzaChzZXJpZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRDb2xvcnNGb3JTZXJpZXMoc2VyaWVzKSB7XG4gICAgICAgICAgICB2YXIgY29sb3JzID0gW107XG5cbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZXJpZXMsIGZ1bmN0aW9uIChzZXJpZSwgcGxheWVyTmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbG9ycy5wdXNoKHNlbGYucGxheWVyQ29sb3JzW3BsYXllck5hbWVdKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gY29sb3JzO1xuICAgICAgICB9XG5cbiAgICAgICAgZmV0Y2hTdGF0aXN0aWNzRm9yRGF0ZVJhbmdlKF9kYXRlUmFuZ2UpO1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5zZXJ2aWNlcycpXG4gICAgICAgIC5mYWN0b3J5KCdNYXRjaCcsIE1hdGNoKTtcblxuICAgIGZ1bmN0aW9uIE1hdGNoICgkcmVzb3VyY2Upe1xuICAgICAgICB2YXIgcmVzb3VyY2UgPSAgJHJlc291cmNlKCcvYXBpL21hdGNoZXMvOmlkJywge2lkOidAX2lkJ30sIHtcbiAgICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICBpc0FycmF5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW2Z1bmN0aW9uKGRhdGEsIGhlYWRlcnNHZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoIGhlYWRlcnNHZXR0ZXIoJ1gtVG90YWwtQ291bnQnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlLnRvdGFsQ291bnQgPSBOdW1iZXIoaGVhZGVyc0dldHRlcignWC1Ub3RhbC1Db3VudCcpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmZyb21Kc29uKGRhdGEpO1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBkYXRlOiB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUFVUJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXNvdXJjZS50b3RhbENvdW50ID0gMDtcblxuICAgICAgICByZXR1cm4gcmVzb3VyY2U7XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ3Njb3JlQXBwLnNlcnZpY2VzJylcbiAgICAgICAgLmZhY3RvcnkoJ1BsYXllcicsIFBsYXllcik7XG5cbiAgICBmdW5jdGlvbiBQbGF5ZXIgKCRyZXNvdXJjZSl7XG4gICAgICAgIHJldHVybiAkcmVzb3VyY2UoJy9hcGkvcGxheWVycycsIHt9LCB7XG4gICAgICAgICAgICBxdWVyeToge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgaXNBcnJheTogZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ3Njb3JlQXBwLnNlcnZpY2VzJylcbiAgICAgICAgLmZhY3RvcnkoJ1VzZXInLCBVc2VyKTtcblxuICAgIGZ1bmN0aW9uIFVzZXIgKCRyZXNvdXJjZSl7XG4gICAgICAgIHJldHVybiAkcmVzb3VyY2UoJy9hcGkvdXNlcicsIHt9LCB7XG4gICAgICAgICAgICBxdWVyeToge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgaXNBcnJheTogZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ3Njb3JlQXBwLnNlcnZpY2VzJylcbiAgICAgICAgLmZhY3RvcnkoJ0F1dGgnLCBBdXRoU2VydmljZSk7XG5cbiAgICBmdW5jdGlvbiBBdXRoU2VydmljZSgkcm9vdFNjb3BlLCAkaHR0cCwgQVVUSF9FVkVOVFMsIGxvY2FsU3RvcmFnZVNlcnZpY2UpIHtcbiAgICAgICAgdmFyIEF1dGhTZXJ2aWNlID0ge1xuICAgICAgICAgICAgdXNlcjogbnVsbCxcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZWQ6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUmV0cmlldmUgdXNlciBhdXRoIGRldGFpbHMgZnJvbSBsb2NhbCBzdG9yYWdlXG4gICAgICAgIGlmIChsb2NhbFN0b3JhZ2VTZXJ2aWNlLmlzU3VwcG9ydGVkKSB7XG4gICAgICAgICAgICB2YXIgdXNlciA9IGxvY2FsU3RvcmFnZVNlcnZpY2UuZ2V0KCd1c2VyJyk7XG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmF1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4gPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgJGh0dHAoeyBtZXRob2Q6ICdHRVQnLCB1cmw6ICcvYXBpL3VzZXInIH0pXG5cbiAgICAgICAgICAgICAgICAvLyBVc2VyIHN1Y2Nlc3NmdWxseSBhdXRoZW50aWNhdGVzXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuYXV0aGVudGljYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLnVzZXIgPSBkYXRhO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIHVzZXIgYXV0aCBkZXRhaWxzIGluIGxvY2FsIHN0b3JhZ2VcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvY2FsU3RvcmFnZVNlcnZpY2UuaXNTdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZVNlcnZpY2Uuc2V0KCd1c2VyJywgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mKGNhbGxiYWNrKSA9PT0gdHlwZW9mKEZ1bmN0aW9uKSkgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLy8gTm90IGxvZ2dlZCBpblxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5hdXRoZW50aWNhdGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luRmFpbGVkKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mKGNhbGxiYWNrKSA9PT0gdHlwZW9mKEZ1bmN0aW9uKSkgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgQXV0aFNlcnZpY2UuYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgQXV0aFNlcnZpY2UudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgICRodHRwKHsgbWV0aG9kOiAnR0VUJywgdXJsOiAnL2xvZ291dCcgfSlcblxuICAgICAgICAgICAgLy8gVXNlciBzdWNjZXNzZnVsbHkgbG9nZ2VkIG91dFxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2NhbFN0b3JhZ2VTZXJ2aWNlLmlzU3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2VTZXJ2aWNlLnJlbW92ZSgndXNlcicpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZihjYWxsYmFjaykgPT09IHR5cGVvZihGdW5jdGlvbikpIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC8vIFNpZ24gb3V0IGVycm9yXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YoY2FsbGJhY2spID09PSB0eXBlb2YoRnVuY3Rpb24pKSBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5hdXRoZW50aWNhdGVkO1xuICAgICAgICB9O1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmlzQXV0aG9yaXplZCA9IGZ1bmN0aW9uIChhdXRob3JpemVkUm9sZXMpIHtcbiAgICAgICAgICAgIGlmICghYW5ndWxhci5pc0FycmF5KGF1dGhvcml6ZWRSb2xlcykpIHtcbiAgICAgICAgICAgICAgICBhdXRob3JpemVkUm9sZXMgPSBbYXV0aG9yaXplZFJvbGVzXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAoQXV0aFNlcnZpY2UuYXV0aGVudGljYXRlZCAmJiBhdXRob3JpemVkUm9sZXMuaW5kZXhPZihBdXRoU2VydmljZS51c2VyLnJvbGUpICE9PSAtMSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlO1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5zZXJ2aWNlcycpXG4gICAgICAgIC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBBdXRoSW50ZXJjZXB0b3IpO1xuXG4gICAgZnVuY3Rpb24gQXV0aEludGVyY2VwdG9yKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHtcbiAgICAgICAgICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgICAgICAgICB9W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnc2NvcmVBcHAuc2VydmljZXMnKVxuICAgICAgICAuZmFjdG9yeSgnQXV0aFJlc29sdmVyJywgQXV0aFJlc29sdmVyKTtcblxuICAgIGZ1bmN0aW9uIEF1dGhSZXNvbHZlcigkcSwgJHJvb3RTY29wZSwgJHN0YXRlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNvbHZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICAgICB2YXIgdW53YXRjaCA9ICRyb290U2NvcGUuJHdhdGNoKCdjdXJyZW50VXNlcicsIGZ1bmN0aW9uIChjdXJyZW50VXNlcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoY3VycmVudFVzZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGN1cnJlbnRVc2VyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB1bndhdGNoKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnc2NvcmVBcHAuc2VydmljZXMnKVxuICAgICAgICAuZmFjdG9yeSgnQ29uZmlnJywgQ29uZmlnKTtcblxuICAgIGZ1bmN0aW9uIENvbmZpZyAoJGh0dHAsICRxKSB7XG4gICAgICAgIHZhciBDb25maWcgPSB7XG4gICAgICAgICAgICBhcHA6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBDb25maWcuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKENvbmZpZy5hcHApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQ29uZmlnLmFwcDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHByb21pc2UgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgJGh0dHAoe21ldGhvZDogJ0dFVCcsIHVybDogJy9hcGkvY29uZmlnJ30pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgQ29uZmlnLmFwcCA9IHJlc3BvbnNlLmRhdGE7XG5cbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKENvbmZpZy5hcHApO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2UucHJvbWlzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gQ29uZmlnO1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdzY29yZUFwcC5zZXJ2aWNlcycpXG4gICAgICAgIC5mYWN0b3J5KCdQbGF5ZXJNYW5hZ2VyJywgUGxheWVyTWFuYWdlcik7XG5cbiAgICBmdW5jdGlvbiBQbGF5ZXJNYW5hZ2VyIChQbGF5ZXIpe1xuICAgICAgICB2YXIgY29sb3JzID0gW1xuICAgICAgICAgICAgJyMzMDRmZmUnLFxuICAgICAgICAgICAgJyNhYTAwZmYnLFxuICAgICAgICAgICAgJyNkNTAwMDAnLFxuICAgICAgICAgICAgJyMwMDkxZWEnLFxuICAgICAgICAgICAgJyMwMGM4NTMnLFxuICAgICAgICAgICAgJyNhZWVhMDAnLFxuICAgICAgICAgICAgJyNmZjZkMDAnLFxuICAgICAgICAgICAgJyM1ZDQwMzcnLFxuICAgICAgICAgICAgJ2N5YW4nLFxuICAgICAgICAgICAgJ3B1cnBsZSdcbiAgICAgICAgXTtcblxuICAgICAgICB2YXIgUGxheWVyTWFuYWdlciA9IHt9O1xuXG4gICAgICAgIFBsYXllck1hbmFnZXIucGxheWVycyA9IHt9O1xuICAgICAgICBQbGF5ZXJNYW5hZ2VyLm5hbWVzID0ge307XG4gICAgICAgIFBsYXllck1hbmFnZXIuY29sb3JzID0ge307XG5cbiAgICAgICAgUGxheWVyTWFuYWdlci5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcHJvbWlzZSA9IFBsYXllci5xdWVyeSgpLiRwcm9taXNlO1xuXG4gICAgICAgICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24ob2JqZWN0cyl7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSAwO1xuXG4gICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKG9iamVjdHMsIGZ1bmN0aW9uKHBsYXllciwgaWQpe1xuICAgICAgICAgICAgICAgICAgICBpZiAoaWQgIT0gJyRwcm9taXNlJyAmJiBpZCAhPSAnJHJlc29sdmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGxheWVyLmNvbG9yID0gY29sb3JzW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBQbGF5ZXJNYW5hZ2VyLnBsYXllcnNbaWRdID0gcGxheWVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgUGxheWVyTWFuYWdlci5uYW1lc1tpZF0gPSBwbGF5ZXIubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFBsYXllck1hbmFnZXIuY29sb3JzW2lkXSA9IHBsYXllci5jb2xvcjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFBsYXllck1hbmFnZXI7XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ3Njb3JlQXBwLnNlcnZpY2VzJylcbiAgICAgICAgLmZhY3RvcnkoJ1N0YXRpc3RpYycsIFN0YXRpc3RpY1NlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gU3RhdGlzdGljU2VydmljZSgkaHR0cCwgbW9tZW50LCBQRVJJT0RTKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldERhdGVSYW5nZUZvclBlcmlvZDogZnVuY3Rpb24ocGVyaW9kKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0RGF0ZTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kRGF0ZSA9IG5ldyBEYXRlKCk7XG5cbiAgICAgICAgICAgICAgICBzd2l0Y2gocGVyaW9kKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgUEVSSU9EUy5XRUVLOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnREYXRlID0gbW9tZW50KCkuc3VidHJhY3QoNywgJ2RheXMnKS50b0RhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFBFUklPRFMuVFdPV0VFSzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0RGF0ZSA9IG1vbWVudCgpLnN1YnRyYWN0KDE0LCAnZGF5cycpLnRvRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgUEVSSU9EUy5NT05USDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0RGF0ZSA9IG1vbWVudCgpLnN1YnRyYWN0KDEsICdtb250aCcpLnRvRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgUEVSSU9EUy5RVUFSVEVSOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnREYXRlID0gbW9tZW50KCkuc3VidHJhY3QoMywgJ21vbnRocycpLnRvRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge3N0YXJ0RGF0ZTogc3RhcnREYXRlLCBlbmREYXRlOiBlbmREYXRlfTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGdldFdpbm5pbmdQZXJjZW50YWdlc0ZvckRhdGVSYW5nZTogZnVuY3Rpb24oZGF0ZVJhbmdlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwaS93aW5uaW5nUGVyY2VudGFnZXM/c3RhcnREYXRlPScgKyBtb21lbnQoZGF0ZVJhbmdlLnN0YXJ0RGF0ZSkuZm9ybWF0KCdZWVlZLU1NLUREJykgKyAnJmVuZERhdGU9JyArIG1vbWVudChkYXRlUmFuZ2UuZW5kRGF0ZSkuZm9ybWF0KCdZWVlZLU1NLUREJylcbiAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgY3JlYXRlTGVhZGVyYm9hcmRzRnJvbVdpbm5pbmdQZXJjZW50YWdlczogZnVuY3Rpb24od2lubmluZ1BlcmNlbnRhZ2VzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRyYW5zZm9ybVBsYXllclN0YXRzID0gZnVuY3Rpb24ocGxheWVyU3RhdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHdpblBlcmNlbnQgPSBNYXRoLnJvdW5kKHBsYXllclN0YXRzLndpblBlcmNlbnQgKiAxMDAwMCkgLyAxMDA7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuZXh0ZW5kKHt9LCBwbGF5ZXJTdGF0cywge3dpblBlcmNlbnQ6IHdpblBlcmNlbnR9KTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc29sbzogd2lubmluZ1BlcmNlbnRhZ2VzLnNvbG9bd2lubmluZ1BlcmNlbnRhZ2VzLnNvbG8ubGVuZ3RoIC0gMV0ucGVyY2VudGFnZXMubWFwKHRyYW5zZm9ybVBsYXllclN0YXRzKSxcbiAgICAgICAgICAgICAgICAgICAgZHVvOiB3aW5uaW5nUGVyY2VudGFnZXMuZHVvW3dpbm5pbmdQZXJjZW50YWdlcy5kdW8ubGVuZ3RoIC0gMV0ucGVyY2VudGFnZXMubWFwKHRyYW5zZm9ybVBsYXllclN0YXRzKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxufSkoKTsiXX0=
