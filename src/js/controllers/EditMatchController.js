(function () {
    'use strict';
    angular
        .module('scoreApp.controllers')
        .controller('EditMatchController', EditMatchController);

    /**
     * Convert ISOString date to Date object
     * @param {string} dateString
     * @returns {Date}
     */
    function convertDate(dateString) {
        var a;

        if (typeof dateString === 'string') {
            a = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);
            if (a) {
                return new Date(+a[1], +a[2] - 1, +a[3]);
            }
        }
    }

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
                match.date = convertDate(match.date);
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
                match = angular.extend({}, self.match);

                match.team1 = angular.extend({}, match.team1);
                match.team2 = angular.extend({}, match.team2);

                match.team1.players = match.team1.players.map(function(player){ if (player) return player._id; else return null; });
                match.team2.players = match.team2.players.map(function(player){ if (player) return player._id; else return null; });

                Match.update(match, successCallback, errorCallback);
            } else {
                match = new Match(angular.extend({}, self.match));

                match.team1 = angular.extend({}, match.team1);
                match.team2 = angular.extend({}, match.team2);

                match.team1.players = match.team1.players.map(function(player){ if (player) return player._id; else return null; });
                match.team2.players = match.team2.players.map(function(player){ if (player) return player._id; else return null; });

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