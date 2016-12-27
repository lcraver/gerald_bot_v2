var app = angular.module("gerald", []);

app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
});

app.controller('geraldController', function ($rootScope, $scope, $http) {

  // Begin Update Loop
  setInterval(function(){
    $rootScope.updateInterface();
  }, 10000)

  $scope.users = [];

  $rootScope.updateInterface = function () {
    $http({
      method: 'GET',
      url: 'http://localhost:3000/users'
    }).then(function successCallback(queueData) {
      $scope.users = queueData.data;
    }, function errorCallback(response) {
      console.log(response);
    });
  };

  $rootScope.updateInterface();

});

/*

app.directive('header', function () {
    return {
        replace: true,
        templateUrl: "directives/header.html",
        controller: ['$scope', '$filter', function ($scope, $filter) {

          $scope.flipSearch = function() {
            $scope.$root.searching = !$scope.$root.searching;
            console.log("Flipped Search");
          }

          $scope.getSearch = function() {
            return $scope.$root.searching;
          }

        }]
    }
});

app.directive('queueElement', function () {
    return {
      replace: true,
      templateUrl: "directives/queueElement.html",
      scope: { song: '=song' },
      controller: ['$scope', '$rootScope', '$filter', '$http', function ($scope, $rootScope, $filter, $http) {

      }]
    }
});

app.directive('searchElement', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: "directives/searchElement.html",
      scope: { song: '=song' },
      controller: ['$scope', '$rootScope', '$filter', '$http', function ($scope, $rootScope, $filter, $http) {

        $scope.handleVote = function() {

        }

        $scope.setSearchText = function() {

        }

      }]
    }
});
*/