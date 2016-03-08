/**
 * Created by oddgeir on 25/08/14.
 */

angular.module('votelive').controller('ResultCtrl', ['$http', '$scope', 'firebaseInteraction', '$timeout', 'angularFire', 'angularFireCollection',
    function ($http, $scope, firebaseInteraction, $timeout, angularFire, angularFireCollection) {
        $scope.activeQuestionId = -1; // TODO: Remove or refactor
        var questionsRef = new Firebase(firebaseRefUri + '/questions');
        $scope.questions = angularFireCollection(questionsRef, function(){});
        $scope.$on('answersUpdated', function(e, ans){
            $scope.answersObj = ans;
        });

        var updateFirebaseEventHandler = function(questKey){
            if($scope.questions.length > 0){
                if(questKey !== undefined){
                    console.log('questKey: ' + questKey);
                    firebaseInteraction.updateEventListeners(questKey);
                    return true;
                }
            }
            return false;
        };

        var qPriority = location.href.split('results/')[1] || null;

        if( qPriority ) {
            var questionsWatchDeReg = $scope.$watchCollection('questions', function(){
                console.log('questions: ' + $scope.questions.length);
                angular.forEach($scope.questions, function(value) {
                    if(value.$priority === parseInt(qPriority)) {
                        $scope.activeQuestionId = value.$id;
                        if(updateFirebaseEventHandler($scope.activeQuestionId)){
                            console.log('dereg');
                            questionsWatchDeReg();
                        }
                    }
                });
            });
        }
        else {
            var activeQuestionRef = new Firebase(firebaseRefUri + '/activeQuestionId');
            angularFire(activeQuestionRef, $scope, 'activeQuestionId');

            $scope.$watch('activeQuestionId', function(newValue){
                updateFirebaseEventHandler(newValue);
            });
        }
    }]);
