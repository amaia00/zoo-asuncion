'use strict';

/**
 * @ngdoc
 * @name yvyUiApp.controller:FilterCtrl
 * @description
 * # ActiveTabCtrl
 * Controller of the yvyUiApp
 * This controller, is for the left side bar, with filter by
 * animals, and POIs (Point Of Interest)
 */
angular.module('yvyUiApp')
    .controller('FilterCtrl', function ($scope, zooAsuFactory, $route) {
        //$scope.route = $route;
        $scope.nombre_animal = "";
        // Just One filter can be true at time
        // Initially all False
        var poi_hash = {
            'banho': false,
            'agua': false,
            'asiento': false,
            'estacionamiento': false,
            'guardaparque': false,
            'museo': false,
            'areadescanso': false
        };
        $scope.poi_hash = poi_hash;

        $scope.togglePOIFilter = function (poi_selected) {
            for (var poi_type in poi_hash) {
                if (poi_hash.hasOwnProperty(poi_type)) {
                    if (poi_type === poi_selected) {
                        poi_hash[poi_type] = !poi_hash[poi_type];
                    } else {
                        poi_hash[poi_type] = false;
                    }
                }
            }

            zooAsuFactory.filtrarMapa(buildCriteria());
        };

        $scope.updateMap = function () {
            if ($scope.nombre_animal.length > 2) {
                zooAsuFactory.filtrarMapa(buildCriteria());
            }
        };


        /**
         * Construye el Objeto que contiene los criterios de filtrado
         * tanto el Nombre del animal como el POI deseado
         * @return criterio
         */
        var buildCriteria = function () {
            var poi_filter;
            for (var poi in poi_hash) {
                if (!poi_hash.hasOwnProperty(poi)) continue;

                if (poi_hash[poi] === true) {
                    poi_filter = poi;
                    break;
                }

            }
            return {'nombre_animal': $scope.nombre_animal, 'poi': poi_filter};
        };

    });