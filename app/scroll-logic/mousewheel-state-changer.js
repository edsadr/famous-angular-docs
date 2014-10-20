angular.module('famous-angular')

.run(function($rootScope, $famous, $state, stateUtils) {
  var Easing = $famous['famous/transitions/Easing'];
  var Transitionable = $famous['famous/transitions/Transitionable'];

  var progressTimeline = new Transitionable(0);
  $rootScope.progressTimeline = progressTimeline;
  var gravityTimeline = new Transitionable(0);
  $rootScope.gravityTimeline = gravityTimeline;

  var gravityTimeout;

  $rootScope.$on('$stateChangeSuccess', function() {
    if (gravityTimeout) {
      clearTimeout(gravityTimeout);
      gravityTimeout = null;
    }

    var indexMidpoint = $state.current.data.index + 0.5;
    progressTimeline.set(indexMidpoint, {duration: 500});
    gravityTimeline.set(indexMidpoint, { duration: 500 });
  });

/*--------------------------------------------------------------*/

  var WAIT_BEFORE_NEXT_STATE_CHANGE = 800;

  var preventStateChange;

  $(window).on('mousewheel', {
    mousewheel: {
      debounce: true,
      throttle: true
    }
  }, function(e) {

    if (preventStateChange) return;

    e.deltaY = correctDeltaY(e.deltaY);

    var newProgressValue = progressTimeline.get() + e.deltaY;

    progressTimeline.halt();
    progressTimeline.set(newProgressValue, { duration: 0 });
    gravityTimeline.set(newProgressValue, { duration: 0 });

    if (gravityTimeout) {
      clearTimeout(gravityTimeout);
      gravityTimeout = null;
    }

    gravityTimeout = setTimeout(function() {
      var startingPoint = $state.current.data.index + 0.5;
      progressTimeline.halt();
      progressTimeline.set(startingPoint, { duration: 500 });
      gravityTimeline.halt();
      gravityTimeline.set(startingPoint, { duration: 1500, curve: Easing.outElastic });
    }, 300);

    if (traveledFarEnoughForStateChange(newProgressValue)) {
      changeState(e.deltaY); 

      preventStateChange = true;
      setTimeout(function() {
        preventStateChange = false;
      }, WAIT_BEFORE_NEXT_STATE_CHANGE);
    }

  });


  function correctDeltaY(deltaY) {
    // Normally 'scrolling' down === -e.deltaY.  But when scrolling down,
    // we want to move the page forward.  Invert the original e.deltaY so that
    // when talking about moving forward, we can use positive numbers.
    deltaY = -deltaY;

    // Our ranges for state changes are between [0, 7], so scale e.deltaY
    // appropriately
    deltaY = deltaY / 100;

    var MAXIMUM_SCROLL_DISTANCE = 0.03;
    // Force a range of [-MAXIMUM_SCROLL_DISTANCE, MAXIUM_SCROLL_DISTANCE]
    deltaY = Math.min(MAXIMUM_SCROLL_DISTANCE, deltaY);
    deltaY = Math.max(-MAXIMUM_SCROLL_DISTANCE, deltaY);

    return deltaY;
  }


  function traveledFarEnoughForStateChange(newProgressValue) {
    var progressValueStartingPoint = ($state.current.data.index + 0.5);
    var delta = Math.abs(newProgressValue - progressValueStartingPoint);
    return delta > 0.5;
  }


  function changeState(deltaY) {
    var direction = deltaY > 0 ? 'forward' : 'backwards';
    var indexChange = direction === 'forward' ? 1 : -1;
    var currentStateIndex = $state.current.data.index;
    stateUtils.goToStateWithIndex(currentStateIndex + indexChange);
  }

});
