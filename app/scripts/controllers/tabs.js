'use strict';

/**
 * @ngdoc function
 * @name yvyUiApp.controller:ActiveTabCtrl
 * @description
 * # ActiveTabCtrl
 * Controller of the yvyUiApp
 */
angular.module('yvyUiApp')
  .controller('ActiveTabCtrl', function ($scope, $route) {
    $scope.route = $route;
  });
