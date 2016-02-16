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
      return   {
        'geometry': {
          'coordinates': [-25.25032, -57.57210],
          'type': "Point"
        },
        'properties': {},
        'type': 'Feature'
      }
    },

    getGeojson: function(){
      return $http.get('data/zoo-as.geojson').then(function(response){
        return response.data;
      });
    },
  };
});
