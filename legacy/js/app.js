'use strict';


// Declare app level module which depends on filters, and services
angular.module('blackFridayApp', [
  'ngRoute',
  'blackFridayApp.controllers'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/game', {templateUrl: 'partials/viewGame.html', controller: 'gameCtrl'});
  $routeProvider.otherwise({redirectTo: '/game'});
}]);
