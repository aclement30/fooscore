(function () {
    'use strict';
    angular
        .module('scoreApp.controllers')
        .controller('AppController', AppController);

    function AppController ($mdSidenav, $rootScope) {
        var self = this;

        var _defaultUI = {
            addButton: true,
            backButton: true
        };

        self.ui = angular.extend({}, _defaultUI);

        $rootScope.$on('$stateChangeStart', function(event, toState){
            if (toState.data) {
                self.ui = angular.extend({}, _defaultUI, toState.data.ui);
            } else {
                self.ui = angular.extend({}, _defaultUI);
            }
        });

        self.closeMenu = closeMenu;
        self.toggleMenu = toggleMenu;

        function toggleMenu() {
            $mdSidenav('left').toggle();
        }

        function closeMenu() {
            $mdSidenav('left').close();
        }
    }
})();