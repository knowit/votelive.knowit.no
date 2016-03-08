/**
 * Created by oddgeir on 25/08/14.
 */

angular.module('votelive').controller('QuestionCtrl', ['$http', '$scope', 'angularFire', 'angularFireCollection', 'localStorageService',
    function ($http, $scope, angularFire, angularFireCollection, localStorageService) {

        var urlArray = location.href.split('/');
        var regExPattern = new RegExp('^[0-9]+');
        var qid = regExPattern.exec(urlArray[urlArray.length-1]);
        var url = '/questions/active';
        if( qid ) {
            url = '/questions/'+ qid;
        }

        $scope.questions = angularFireCollection(new Firebase(firebaseRefUri + '/questions'));
        var activeQuestionRef = new Firebase(firebaseRefUri + '/activeQuestionId');
        angularFire(activeQuestionRef, $scope, 'activeQuestionId');
        $scope.answers = angularFireCollection(new Firebase(firebaseRefUri + '/answers'));
        $scope.activeQuestion = undefined;

        //TODO [awe]: Make this work when questions are not populated yet.
        $scope.$watch('activeQuestionId', function(newValue) {
            $scope.activeQuestion = $scope.getQuestionById(newValue);
        });

        $scope.getQuestionById = function(id) {
            for(var i=0; i<$scope.questions.length; i++) {
                if($scope.questions[i].$id === id) {
                    console.log('Returning question with text [' + $scope.questions[i].text + ']');
                    return $scope.questions[i];
                }
            }
        };

        activeQuestionRef.on('value',function(dataSnapshot){
            $scope.currentAnswer = undefined;
            $scope.inputAnswer = undefined;
        });

        $scope.selectAnswer = function(e){

            var choices = $("div[id='radioInput']");

            for(var i = 0; i < choices.length; i++){
                angular.element(choices[i]).scope().alt.isSelected = false;
            }
            angular.element(e.srcElement).scope().alt.isSelected = true;
        };

        $scope.showErrorFeedback = function(){
            if($scope.feedback !== undefined){
                return $scope.feedback.type === 'error';
            }
            return false;
        };

        $scope.isQuestionAnswered = function(){
            return $scope.currentAnswer !== undefined;
        };

        $scope.waitingForQuestion = function(){

            if($scope.questions === undefined || $scope.activeQuestion === undefined){
                return true;
            }

            if($scope.isQuestionAnswered() ||
              $scope.activeQuestion === undefined ||
              localStorageExist($scope.activeQuestion.$id) === true){
                return true;
            }
            return false;
        };

        $scope.typeHint = function(){
//        console.log($scope.questions[$scope.activeQuestion]);
            var typeHint = 'String value';
            var question = undefined;
            // TODO: Need method to get active question
            angular.forEach($scope.questions, function(value) {
                if(value.$id === $scope.activeQuestionId) {
                    question = value;
                }
            });
            if(question !== undefined && question.type === 'number'){
                typeHint = 'Integer value';
            }
            return typeHint;
        };
        var storageAns = localStorageService.get('Answers');
        if(storageAns === null){
            localStorageService.add('Answers','[]');
        }

        function localStorageAdd(answerID){
            var storageCollection = localStorageService.get('Answers');
            storageCollection.push(answerID);
            localStorageService.add('Answers',storageCollection);
        }

        function localStorageExist(answerID){
            var storageCollection = localStorageService.get('Answers');
            var exists = false;
            if(storageCollection !== null){
                if(storageCollection.indexOf(answerID) !== -1){
                    exists = true;
                }
            }
            return exists;
        }

        $scope.answer = function() {
            var regExNumber = new RegExp("^[0-9]+$");
            if ($scope.activeQuestion.type === 'number'
                && (!regExNumber.test($scope.inputAnswer)
                || $scope.inputAnswer < $scope.activeQuestion.minValue
                || $scope.inputAnswer > $scope.activeQuestion.maxValue)
                ) {
                $scope.feedback = {
                    type: 'error',
                    msg: 'Integer value between ' + $scope.activeQuestion.minValue + ' and ' + $scope.activeQuestion.maxValue + '!'
                };
            }
            else if(($scope.activeQuestion.type === 'multiplechoice'  || $scope.activeQuestion.type === 'multiplechoice_with_correct')
                && $scope.inputAnswer === undefined){
                $scope.feedback = {
                    type: 'error',
                    msg: 'Select alternative'
                };
            }
            else{
                var questionResponse = {};
                if($scope.activeQuestion.type === 'multiplechoice'  || $scope.activeQuestion.type === 'multiplechoice_with_correct') {
                    questionResponse.ref = $scope.inputAnswer;
                } else {
                    questionResponse.text = $scope.inputAnswer;
                }
                questionResponse.language = navigator.language;
                questionResponse.browserInfo = navigator.appVersion;

                var newUri = firebaseRefUri + '/questions/';
                newUri = newUri + $scope.activeQuestion.$id + '/answers';
                $scope.answers = angularFireCollection(new Firebase(newUri));
                $scope.answers.add(questionResponse);
                localStorageAdd($scope.activeQuestion.$id);
                $scope.currentAnswer = $scope.inputAnswer;
                $scope.feedback = {
                    type : 'success',
                    msg : 'Thanks for your answer!'
                };
            }
        };
    } ]);
