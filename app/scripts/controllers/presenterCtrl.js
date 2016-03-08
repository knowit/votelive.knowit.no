/**
 * Created by oddgeir on 25/08/14.
 */

angular.module("votelive").controller("PresenterCtrl", ['$http', '$scope', '$timeout', 'angularFire', 'angularFireCollection',
    function ($http, $scope, $timeout, angularFire, angularFireCollection) {
        $scope.questionTypes = questionTypes;
        angularFire(new Firebase(firebaseRefUri + '/activeQuestionId'), $scope, 'activeQuestionId');
        $scope.questions = angularFireCollection(new Firebase(firebaseRefUri + '/questions'));

        $scope.panelActive = function(id){
            if(id === $scope.activeQuestionId){
                return "panel panel-success";
            }
            else{
                return "panel panel-default";
            }
        };

        $scope.prevQuestion = function(){
            // TODO: Find previous question by priority
            $scope.activeQuestionId > 0 ? $scope.activeQuestionId-- : 0;
        }

        $scope.nextQuestion = function(){
            // TODO: Find next question by priority
            $scope.activeQuestionId < $scope.questions.length-1 ? $scope.activeQuestionId++ : $scope.questions.length-1;
        }

        $scope.deleteAnswers = function(question){
            var answersRef = new Firebase(firebaseRefUri + '/questions/'+ question.$id + "/answers");
            answersRef.remove();
            angular.forEach(question.alternatives, function(value, key){
                if(value.count){
                    var countRef = new Firebase(firebaseRefUri + '/questions/'+ question.$id + "/alternatives/"+ key +"/count");
                    countRef.remove();
                }
            });
        };

        $scope.deleteQuestion = function(question){
            var questionRef = new Firebase(firebaseRefUri + '/questions/'+ question.$id);
            questionRef.remove();
        }

        $scope.deleteAlternative = function(question, altKey){
            var questionRef = new Firebase(firebaseRefUri + '/questions/'+ question.$id + '/alternatives/' + altKey);
            questionRef.remove(function(error){
                if (!$scope.$$phase){
                    $scope.$apply();
                }
//			if(alternative.$index < question.alternatives.length && !error){
//				var i=0;
//				angular.forEach(question.alternatives, function(value, key){
//					var alt = new Firebase(firebaseRefUri + '/questions/'+ question.$id + '/alternatives/' + key +'/id');
//					alt.set(i);
//					i++;
//				});
//			}
            });
            $scope.deleteAnswers(question);

        }

        $scope.activateQuestion = function(question) {
            $scope.activeQuestionId = question.$id;
        }

        $scope.newAlternative = function(question, event){
            if(event.keyCode === 13){
                var alternativesRef = angularFireCollection(
                    new Firebase(firebaseRefUri + '/questions/' + question.$id + '/alternatives'));
                var newAlt = new Object();
                newAlt.text = event.currentTarget.value;

                alternativesRef.add(newAlt);

                event.currentTarget.value = null;
            }
        };

        $scope.addQuestion = function(){
            var question = new Object();
            question.text = $scope.inputQuestion;
            question.type = $scope.inputType;
            if($scope.inputType === 'number'){
                question.minValue = $scope.inputMinLim;
                question.maxValue = $scope.inputMaxLim;
            }
            var ref = $scope.questions.add(question);
            var newQuestion = new Firebase(firebaseRefUri + "/" + ref.path.m[0] + "/" + ref.path.m[1])
            var highest = 0;
            angular.forEach($scope.questions, function(value, key) {
                if(value.$priority > highest) {
                    highest = value.$priority;
                }
            });
            newQuestion.setPriority(highest + 1);

            $scope.deleteQuestionInput();
        };

        $scope.deleteQuestionInput = function(){
            $scope.inputQuestion = null;
            $scope.inputType = null;
            $scope.inputMinLim = null;
            $scope.inputMaxLim = null;
        };

        $scope.toggleCollapse = function(event, panelNr, index){
            if($scope.panelCollapsedIn === panelNr){
                $scope.panelCollapsedIn = null;
                $scope.inputFocus = null;
            }
            else{
                $scope.panelCollapsedIn = panelNr;
                $scope.inputFocus = index;
            }
        };

        $scope.isCollapsed = function(panelId){
            if($scope.panelCollapsedIn === "#"+panelId){
                return "panel-collapse collapse in";
            }
            else{

                return "panel-collapse collapse";
            }
        }
    } ]);