'use strict';

/**
 * @ngdoc function
 * @name yvyUiApp.controller:MapaleafletCtrl
 * @description
 * # MapaleafletCtrl
 * Controller of the yvyUiApp
 */
angular.module('yvyUiApp')
    .factory('zooAsuFactory', function ($http, $filter, $rootScope) {
        /**
         *  retorna el punto donde estará centrado el mapa
         */
        return {
            getCentroZoo: function () {
                return {
                    'geometry': {
                        'coordinates': [-25.25032, -57.57210],
                        'type': "Point"
                    },
                    'properties': {},
                    'type': 'Feature'
                }
            },

            /**
             * Función que realiza la llamada AJAX y retorna el dataset en formato GeoJson
             * @returns Un objeto JSON con todos los features a ser pintados en el mapa
             */
            getGeojson: function () {
                return $http.get('data/zoo-as.geojson').then(function (response) {
                    $rootScope.allFeatures = response.data;
                    return response.data;
                });
            },

            getAnimales: function () {
                return $http.get('data/animales.json').then(function (response) {
                    return response.data
                });
            },

            getAnimalesList: function () {
                return $http.get('data/animals_list.json').then(function (response) {
                    return response.data
                });
            },
            /**
             * Filtra el mapa según los criterios recibidos como parámetro
             * @para allFeatures Objeto con todos los features del mapa
             * @param criterios Objeto que contiene los criterios de filtrado,
             * actualmente {nombre_animal, POI}
             * donde nombre_animal es el nombre del animal buscado y el POI al filtrar (ej. museo)
             * @return geoJson Es el GeoJson con los puntos que deben ser ubicados en el mapa
             */
            filtrarMapa: function (criterios) {
                /**
                 * Helper Verifica que el Feature recibido se de un tipo dado
                 *
                 * @param feature que está siendo evaluado
                 * @param featureType Tipo del feature buscado (ej, turism, amenity, etc)
                 * @param featureSubType Cadena que representa el subtipo de feature (ej: bench);
                 * @returns {boolean} true si es del tipo dado, false si no
                 */
                var isA = function (feature, featureType, featureSubType) {
                    return feature['properties'][featureType] === featureSubType;
                };

                var featureCollection = $rootScope.allFeatures;
                var geoJsonFeatures = $filter('filter')(featureCollection.features, function (value, index, array) {
                    if (criterios.nombre_animal > 2) {
                        // Filter by animal name
                        if (value['properties']['tourism'] === 'attraction') {
                            if (criterios.nombre_animal === value['properties']['name']) { //TODO: Refactor for 'like'-type compare
                                return true;
                            }
                        }
                    }

                    switch (criterios['poi']) {
                        case 'banho':
                            return isA(value, 'amenity', 'toilets');
                        case 'agua':
                            return isA(value, 'amenity', 'drinking_water');
                        case 'asiento':
                            return isA(value, 'amenity', 'bench');
                        case 'estacionamiento':
                            return isA(value, 'amenity', 'parking');
                        case 'guardaparque':
                            return isA(value, 'amenity', 'ranger_station');
                        case 'museo':
                            return isA(value, 'tourism', 'museum');
                        case 'areadescanso':
                            return isA(value, 'highway', 'rest_area');
                        default:
                            // Cuando no viene criterio de busqueda por POI
                            break;

                    }

                    return false;
                });

                var geoJsonFeatureCollection = {'type': "FeatureCollection", 'features': geoJsonFeatures};

                $rootScope.$broadcast('mapa.filtrado', geoJsonFeatureCollection);

            }

        };
    });
