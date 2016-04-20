(function () {
    'use strict';
    angular
        .module('scoreApp.services')
        .factory('Player', PlayerService);

    function PlayerService (){
        var players = {
            "Alexandre": {color: '#304ffe'},
            "Cédric": {color: '#aa00ff'},
            "Vincent": {color: '#d50000'},
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