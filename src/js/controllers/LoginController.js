(function () {
    'use strict';
    angular
        .module('scoreApp.controllers')
        .controller('LoginController', LoginController);

    function LoginController (config, $mdDialog, $location, $sce) {
        var self = this;

        self.groupName = config.group.name;

        var queryStringValue = function (field) {
            var href = window.location.href;
            var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
            var string = reg.exec(href);
            return string ? string[1] : null;
        };

        var authError = queryStringValue('error');

        if (authError) {
            var authErrorMessage;
            switch(authError) {
                case 'unauthorized-email-domain':
                    authErrorMessage = "Ce compte Google ne fait pas partie <br>des domaines autorisés pour " + config.group.name + ".";
                    break;
                default:
                    authErrorMessage = "Erreur inconnue lors de l'authentification via Google";
                    break;
            }

            $mdDialog.show(
                $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('Erreur')
                    .htmlContent($sce.trustAsHtml(authErrorMessage))
                    .ok('OK')
            );
        }
    }
})();