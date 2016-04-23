(function () {
    'use strict';
    angular
        .module('scoreApp.controllers')
        .controller('LoginController', LoginController);

    function LoginController (config) {
        var self = this;

        self.groupName = config.group.name;
    }
})();