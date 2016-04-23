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