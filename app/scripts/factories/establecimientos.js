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
        //var urlBase = 'http://localhost:3000';
        var urlBase = 'http://datos.mec.gov.py'; // Esto es solo temporal, estamos usando el backend solo para probar

        return {

            /* retorna el punto donde estará centrado el mapa */
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

            getGeojson: function () {
                var req = {
                    method: 'GET',
                    dataType: 'json',
                    url: 'https://jsonblob.com/api/company/56b6a7c0e4b01190df4d6287',
                    params: {},
                    async: false,
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8'
                    }
                };

                return $http(req).then(function (result) {
                    return result.data;
                });
            }
        };
    });
