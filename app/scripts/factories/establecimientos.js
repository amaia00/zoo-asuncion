'use strict';

/**
 * @ngdoc function
 * @name yvyUiApp.controller:MapaleafletCtrl
 * @description
 * # MapaleafletCtrl
 * Controller of the yvyUiApp
 */
angular.module('yvyUiApp')
    .factory('mapaEstablecimientoFactory', function ($http, $q) {

        return {

            /**
             *  retorna el punto donde estará centrado el mapa
             */
            getCentroZoo: function () {
                return {
                    'type': 'FeatureCollection',
                    'features': [
                        {
                            'geometry': {
                                'coordinates': [-25.25032, -57.57210],
                                'type': "Point"
                            },
                            'properties': {},
                            'type': 'Feature'
                        }
                    ]
                }
            },

            /**
             * Función que realiza la llamada AJAX y retorna el dataset en formato GeoJson
             * @returns Un objeto JSON con todos los features a ser pintados en el mapa
             */
            getGeojson: function () {
                return $http.get('data/file.geojson').then(function (response) {
                    return response.data
                });
            }
        };
    });
