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