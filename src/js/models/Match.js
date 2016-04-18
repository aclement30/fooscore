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