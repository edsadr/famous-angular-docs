angular.module('famous-angular')

.controller('footerNavCtrl', function($rootScope, $scope, $famous, $timeline) {
  var Transitionable = $famous['famous/transitions/Transitionable'];
  var Easing = $famous['famous/transitions/Easing'];

  $scope.navTimeline = new Transitionable(0);

/*--------------------------------------------------------------*/

  $scope.navbar = {
    opacity: $timeline([
      [0, 0],
      [1, 1]
    ])
  };

  $scope.footer = {
    opacity: $timeline([
      [0, 0],
      [1, 1]
    ]),
    translate: $timeline([
      [0, [0, -40, 0]],
      [1, [0, -40, 0], Easing.outBack],
      [2, [0, -770, 0], Easing.outBounce],
      [3, [0, -40, 0]]
    ])
  };

/*--------------------------------------------------------------*/

  $scope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
    $scope.navTimeline.halt();

    var delay = getDelay(fromState) + $rootScope.DELAY_BETWEEN_ENTER_LEAVE_ANIMATIONS;

    $scope.navTimeline.delay(delay);

    if (goingToIntroState()) {
      $scope.navTimeline.set(0, {duration: 400});
      return;
    } 
    
    if (goingToEndState()) {
      $scope.navTimeline.set(1, {duration: 0}, function() {
        $scope.navTimeline.set(2, {duration: 400});
      });
      return;
    }

    if (leavingEndState()) {

      // Use a shorter delay when leaving end state, as end state does not
      // have a leave animation
      $scope.navTimeline.halt();
      $scope.navTimeline.delay(100);

      $scope.navTimeline.set(3, {duration: 700}, function() {
        $scope.navTimeline.set(1, {duration: 0});
      });
      return;
    }

    // Must be a state between 1 - 5, so always show sidebar
    $scope.navTimeline.set(1, {duration: 300});
    return;

    function getDelay(prevState) {
      if (!prevState.data) return 0;
      return prevState.data.leaveAnimationDuration;
    }

    function goingToIntroState() {
      return toState.data.index === 0;
    }

    function goingToEndState() {
      return toState.data.index === 6;
    }

    function leavingEndState() {
      if (!fromState.data) return false;
      return fromState.data.index === 6;
    }

  });

/*--------------------------------------------------------------*/

  window.rootScope = $rootScope;

  var maxRange = 700;

  $scope.scrollProgressDots = {
    dot1: {
      translate: $timeline([
        [0, [0, 0, 0]],
        [maxRange, [maxRange, 0, 0], Easing.inOutQuad],
      ])
    },
    dot2: {
      translate: $timeline([
        [0, [10, 0, 0]],
        [maxRange, [maxRange + 15, 0, 0], Easing.inOutQuad],
      ])
    },
    dot3: {
      translate: $timeline([
        [0, [20, 0, 0]],
        [maxRange, [maxRange + 30, 0, 0], Easing.inOutQuad],
      ])
    }
  };

});
