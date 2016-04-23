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