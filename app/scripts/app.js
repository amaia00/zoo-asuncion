'use strict';

/**
 * @ngdoc overview
 * @name yvyUiApp
 * @description
 * # yvyUiApp
 *
 * Main module of the application.
 */
angular
  .module('yvyUiApp', [
    'ngAnimate',
    'ngAria',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about-us', {
        templateUrl: 'views/about-us.html',
        controller: 'AboutCtrl'
      })
      .when('/mapa', {
        templateUrl: 'views/mapa_establecimientos.html',
        controller: 'MapaEstablecimientosCtrl'
      })
      .when('/geojson', {
	      templateUrl:'data/zoo-as.geojson'
      })
      .otherwise({
        redirectTo: '/'
      });
  }) ;
