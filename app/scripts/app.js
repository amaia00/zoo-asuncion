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
    'ngTouch',
    'angularUtils.directives.dirPagination'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/mapa', {
        templateUrl: 'views/mapa_zoo_asu.html',
        activetab: 'mapa'
      })
      .when('/datos', {
        templateUrl: 'views/data_list.html',
        controller: 'DataTableCtrl',
        activetab: 'datos'
      })
      .when('/about-us', {
        templateUrl: 'views/about-us.html',
        activetab: 'about'
      })
      .when('/', {
        templateUrl: 'views/main.html',
        activetab: 'home'
      })
      .otherwise({
        redirectTo: '/mapa'
      });
  });
