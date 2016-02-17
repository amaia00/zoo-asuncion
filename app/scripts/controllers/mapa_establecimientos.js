'use strict';

/**
 * @ngdoc function
 * @name yvyUiApp.controller:MapaleafletCtrl
 * @description
 * # MapaleafletCtrl
 * Controller of the yvyUiApp
 */
angular.module('yvyUiApp')
    .controller('MapaEstablecimientosCtrl', function ($scope, mapaEstablecimientoFactory) {

        $scope.periodo = '';

        console.time('servicio');
        console.time('rest');

        $scope.updateEstablecimientos = function (periodo) {
            $scope.periodo = periodo;
        };

    });
