var module = angular.module('votelive', ['firebase', 'LocalStorageModule']);

var firebaseRefUri = 'https://<your firebase>.firebaseio.com';
var questionTypes = [{type:'number'}, {type:'text'}, {type:'multiplechoice'}];

module.config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'QuestionCtrl'
      })
      .when('/results', {
        templateUrl: 'views/result.html',
        controller: 'ResultCtrl'
      })
      .when('/presenter', {
        templateUrl: 'views/presenter.html',
        controller: 'PresenterCtrl'
      })
      .when('/results/:questionId', {
        templateUrl: 'views/result.html',
        controller: 'ResultCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
});
