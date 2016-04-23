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