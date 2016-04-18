(function () {
    'use strict';
    angular
        .module('scoreApp.controllers')
        .controller('MatchController', MatchController);

    function MatchController (Match, matchId, $mdDialog, $state) {
        var self = this;

        self.match = {};
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