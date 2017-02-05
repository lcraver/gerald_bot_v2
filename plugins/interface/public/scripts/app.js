var app = angular.module("gerald", []);

// Make angular work with handlebars
app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
});

app.controller('geraldController', function ($rootScope, $scope, $http) {

  // Master Variables
  $rootScope.users = [];
  $rootScope.logs = [];
  $scope.view = "dashboard";
  $rootScope.plugins = [];
  $rootScope.toasts = [];
  $rootScope.commands = [];
  $rootScope.customCommands = [];
  $rootScope.points = [];

  $rootScope.startInterface = function () {
    $http({
      method: 'GET',
      url: 'http://localhost:8000/plugins'
    }).then(function successCallback(pluginData) {
      $rootScope.plugins = pluginData.data;
    }, function errorCallback(response) {
      console.log(response);
    });

    $http({
      method: 'GET',
      url: 'http://localhost:8000/commands/message'
    }).then(function successCallback(commandData) {
      $rootScope.commands = commandData.data;
    }, function errorCallback(response) {
      console.log(response);
    });

    $http({
      method: 'GET',
      url: 'http://localhost:8000/customCommands'
    }).then(function successCallback(commandData) {
      $rootScope.customCommands = commandData.data;
    }, function errorCallback(response) {
      console.log(response);
    });
  };
  $rootScope.startInterface();

  // Begin Update Loop
  setInterval(function(){
    //$rootScope.updateInterface();
  }, 10000)

  $rootScope.updateInterface = function () {
    $http({
      method: 'GET',
      url: 'http://localhost:8000/users'
    }).then(function successCallback(queueData) {
      $rootScope.users = queueData.data;
    }, function errorCallback(response) {
      console.log(response);
    });

    $http({
      method: 'GET',
      url: 'http://localhost:8000/logs'
    }).then(function successCallback(logData) {
      $rootScope.logs = logData.data;
      console.log(logData.data);
    }, function errorCallback(response) {
      console.log(response);
    });

    $http({
      method: 'GET',
      url: 'http://localhost:8000/points/top/10'
    }).then(function successCallback(pointData) {
      $rootScope.points = pointData.data;
      console.log(pointData.data);
    }, function errorCallback(response) {
      console.log(response);
    });
  };

  $rootScope.isActiveView = function (view) {
    if ($scope.view == view)
      return "active";
    else
      return "";
  };

  $rootScope.clearLogs = function () {
    $http({
      method: 'POST',
      url: 'http://localhost:8000/logs',
      headers: {
        'Content-Type': 'application/json'
      },
      data: { test: 'test' }
    }).then(function successCallback(logData) {
      $rootScope.logs = [];
      console.log("Logs Cleared!");
    }, function errorCallback(response) {
      console.log(response);
    });
  };

  $rootScope.togglePlugin = function (pluginName) {
    $http({
      method: 'POST',
      url: 'http://localhost:8000/plugins/' + pluginName,
      headers: {
        'Content-Type': 'application/json'
      },
      data: { test: 'test' }
    }).then(function successCallback(logData) {
      console.log("Plugin Toggled ["+pluginName+"]!");
    }, function errorCallback(response) {
      console.log(response);
    });

    $rootScope.addToast("Restart bot to reflect changes.", 5000);

    $rootScope.startInterface();
  };

  // TODO fix toasts glitch
  $rootScope.addToast = function (text, time) {
    if($rootScope.toasts.indexOf(text) <= -1)
    {
      $rootScope.toasts.push(text);
      setTimeout(function() {
        remove(text, $rootScope.toasts);
      }, time);
    }
  };

  // Call on load once
  $rootScope.updateInterface();

});

function remove(what, arr) {
    var found = arr.indexOf(what);

    while (found !== -1) {
        arr.splice(found, 1);
        found = arr.indexOf(what);
    }
}

function arrayContains(needle, arrhaystack)
{
    return (arrhaystack.indexOf(needle) > -1);
}

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
