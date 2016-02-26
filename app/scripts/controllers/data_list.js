'use strict';

/**
 * @ngdoc function
 * @name yvyUiApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the yvyUiApp
 */
angular.module('yvyUiApp')
  .controller('DataTableCtrl', function ($scope, zooAsuFactory) {

    zooAsuFactory.getAnimalesList().then(function(animales) {
        $scope.animales = animales;
    });

    $scope.pagesize = 15 ;
    $scope.sortType     = 'nombre'; // set the default sort type
    $scope.sortReverse  = false;    // set the default sort order
    $scope.search = {};

    $scope.activateSortCol = function (col) {
      if($scope.sortType == col) {
        $scope.sortReverse = !$scope.sortReverse;
      }
      else {
        $scope.sortType = col;
        $scope.sortReverse = false;
      }
    };

  });
