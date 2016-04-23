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