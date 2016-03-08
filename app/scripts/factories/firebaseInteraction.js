/**
 * Created by oddgeir on 25/08/14.
 */

angular.module('votelive').factory('firebaseInteraction', ['$rootScope', '$timeout',
    function($rootScope, $timeout){

        var answersObject = {};
        var eventListeners = [];
        var questionRefKey;
        var maxNumericalInterval = 10;
        var numberOfGropus = 10;

        function deleteAnswers(){
            angular.forEach(eventListeners, function(value){
                value.off();
            });
            eventListeners = [];
            answersObject = {};
            answersObject.answers = [];
            answersObject.count = 0;
            questionRefKey = undefined;
        }

        function addAnswers(childSnapshot){
            if(answersObject.type === 'number' && answersObject.maxValue - answersObject.minValue > maxNumericalInterval){
                if(answersObject.answers.length === 0){
                    generateGroups();
                }
                addGroupedAnswers(childSnapshot);
            }
            else if (answersObject.type === 'multiplechoice') {
                addMultipleChoiceAnswers(childSnapshot, true);
            } else {
                addMultipleChoiceAnswers(childSnapshot, false);
            }
            answersObject.count++;
            calculatePercent();
            broadcastEvent();
        }

        function addGroupedAnswers(childSnapshot){
            var found = false, i = 0;
            var value = parseInt(childSnapshot.val().text);
            while(!found && i<100){
                if(answersObject.answers[i].lowerLimit <= value && answersObject.answers[i].upperLimit >= value){
                    answersObject.answers[i].count++;
                    found = true;
                }
                i++;
            }
        }

        function generateGroups(){
            var i = 0;
            var interval = Math.round((answersObject.maxValue - answersObject.minValue) / (numberOfGropus));
            for(i=0;i<numberOfGropus;i++){
                var group = {};
                group.lowerLimit = i > 0 ? (answersObject.answers[i-1].upperLimit + 1) : (answersObject.minValue);
                group.upperLimit = i < numberOfGropus-1 ? group.lowerLimit + interval-1 : answersObject.maxValue;
                group.description = group.lowerLimit.toString() + '-' + group.upperLimit.toString();
                group.text = i;
                group.id = i;
                group.count = 0;
                answersObject.answers.push(group);
            }
        }

        // checkRef is set to true for answerType multiplechoice
        function addMultipleChoiceAnswers(childSnapshot, checkRef){
            var newAns = {}, i=0, found=false;
            newAns.text = childSnapshot.val().text;
            newAns.description = childSnapshot.val().text;
            newAns.ref = childSnapshot.val().ref;
            newAns.count = 1;
            while(!found){
                if(i >= answersObject.answers.length){
                    answersObject.answers.push(newAns);
                    found = true;
                } //TODO: remove first half of condiftion.. transistional hack
                else if( (newAns.ref === undefined) &&  (answersObject.answers[i].text === newAns.text) ||
                  (checkRef && (answersObject.answers[i].ref === newAns.ref)) ) {
                    answersObject.answers[i].count++;
                    found = true;
                }
                i++;
            }
            setCounter(answersObject.answers[i-1]);
        }

        //Adding answer alternative for eg. display in list
        function addAlternative(childSnapshot){
            var newAlt = childSnapshot.val();
            newAlt.altName = childSnapshot.name();
            newAlt.description = newAlt.text;
//		newAlt.text = newAlt.id.toString();
            newAlt.count = 0;
            newAlt.ref= childSnapshot.name();
            var found = false, i = 0;
            while(!found){
                if(i >= answersObject.answers.length){
                    answersObject.answers.push(newAlt);
                    found = true;
                }
                else if(answersObject.answers[i].ref === newAlt.ref){
                    answersObject.answers[i].id = newAlt.id;
                    answersObject.answers[i].description = newAlt.description;
                    answersObject.answers[i].altName = newAlt.altName;
                    found = true;
                }
                i++;
            }
            setCounter(answersObject.answers[i-1]);
            broadcastEvent();
        }

        function calculatePercent(){
            angular.forEach(answersObject.answers, function(value){
                value.percent = Math.round(value.count / answersObject.count *100);
            });
        }

        function setCounter(ansObj){
            if(ansObj.altName !== undefined){
                var countRef = new Firebase(firebaseRefUri + '/questions/' + questionRefKey + '/alternatives/' + ansObj.altName + '/count');
                if(ansObj.count > 0){
                    countRef.set(ansObj.count);
                }
                else{
                    countRef.remove();
                }
            }
        }

        function addText(dataSnapshot){
            answersObject.text = dataSnapshot.val();
            broadcastEvent();
        }

        function addType(dataSnapshot){
            answersObject.type = dataSnapshot.val();
            broadcastEvent();
        }

        function addMaxValue(dataSnapshot){
            answersObject.maxValue = dataSnapshot.val();
            broadcastEvent();
        }

        function addMinValue(dataSnapshot){
            answersObject.minValue = dataSnapshot.val();
            broadcastEvent();
        }

        function getAnswers(){
            return answersObject;
        }

        function broadcastEvent(){
            $timeout(function () {
                $rootScope.$broadcast('answersUpdated', answersObject);
            }, 0);
        }

        function updateEventListeners(questionKey){
            if(questionKey !== undefined){
                deleteAnswers();
                questionRefKey = questionKey;

                var questTextRef = new Firebase(firebaseRefUri + '/questions/' + questionKey + '/text');
                var questTypeRef = new Firebase(firebaseRefUri + '/questions/' + questionKey + '/type');
                var maxValueRef = new Firebase(firebaseRefUri + '/questions/' + questionKey + '/maxValue');
                var minValueRef = new Firebase(firebaseRefUri + '/questions/' + questionKey + '/minValue');
                var answersRef = new Firebase(firebaseRefUri + '/questions/' + questionKey + '/answers');
                var alternativesRef = new Firebase(firebaseRefUri + '/questions/' + questionKey + '/alternatives');

                questTextRef.on('value', function(dataSnapshot){
                    addText(dataSnapshot);
                });
                questTypeRef.on('value', function(dataSnapshot){
                    addType(dataSnapshot);
                });
                maxValueRef.on('value', function(dataSnapshot){
                    addMaxValue(dataSnapshot);
                });
                minValueRef.on('value', function(dataSnapshot){
                    addMinValue(dataSnapshot);
                });
                answersRef.on('child_added', function(childSnapshot, prevChildName){
                    addAnswers(childSnapshot);
                });
                answersRef.on('child_removed', function(childSnapshot, prevChildName){
                    updateEventListeners(questionKey);
                });
                alternativesRef.on('child_added', function(childSnapshot, prevChildName){
                    addAlternative(childSnapshot);
                });
                alternativesRef.on('child_removed', function(childSnapshot, prevChildName){
                    updateEventListeners(questionKey);
                });

                eventListeners.push(answersRef);
                eventListeners.push(alternativesRef);
                eventListeners.push(questTextRef);
                eventListeners.push(questTypeRef);
                eventListeners.push(maxValueRef);
                eventListeners.push(minValueRef);
            }
        }

        return {
            getAnswers : getAnswers,
            updateEventListeners: updateEventListeners
        };
    }]);
