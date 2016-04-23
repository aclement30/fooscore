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