angular.module('famous-angular')

.run(function($rootScope, $famous, $timeline, $state, scrollEvents) {
  var Transitionable = $famous['famous/transitions/Transitionable'];

  var rangePerState = 100;
  var scrollStates = getScrollStates();
  var stateCount = scrollStates.length;

  $rootScope.bodyHeight = (window.innerHeight * stateCount);

  function getScrollStates() {
    var listOfStates = $state.get();
    var usableStates = listOfStates.filter(function(state) {
      return !!state.data;
    });
    var orderedStates = _.sortBy(usableStates, function(state) {
      return state.data.index;
    });
    return orderedStates;
  }

  $rootScope.scrollProgress = new Transitionable(0);

/*--------------------------------------------------------------*/

  var start = {
    scrollPosition: window.pageYOffset
  };

  scrollEvents.addListeners.scrollstart(function() {
    start.scrollPosition = window.pageYOffset;
  });

  scrollEvents.addListeners.scrollend(function() {
    start.scrollPosition = window.pageYOffset;
  });

/*--------------------------------------------------------------*/

  scrollEvents.addListeners.scroll(function() {
    // If the page is reloaded with the scroll bar anywhere aside from the
    // default window.pageYOffset = 0, the browser will fire a scroll event.
    // Since the event happens before ui.router changes state,
    // $state.current will be the default empty state.
    if (!$state.current.data) return;

    var t = getTimelineFromScroll();

    var currentStateIndex = $state.current.data.index;
    var reachedStateIndex = stateIndex(determineState(t));
    var direction = compare(reachedStateIndex, currentStateIndex);
    var nextStateIndex = Math.max(Math.min(stateCount - 1, currentStateIndex + direction), 0);
    var nextState = scrollStates[nextStateIndex];

    // If the nextState is different, change to and stop updating the
    // scrolll progress
    var readyToChangeState = nextState.name !== $state.current.name;
    if (readyToChangeState) {
      $state.go(nextState.name);
      return;
    }

    $rootScope.scrollProgress.halt();
    $rootScope.scrollProgress.set(t, { duration: 50 });
  });


  function compare(a, b) {
    if (a == b) return 0;
    return a > b ? 1 : -1;
  }

  function stateIndex(s) {
    return _.findIndex(scrollStates, {name: s});
  }

  function getTimelineFromScroll() {
    var scrollMax = $rootScope.bodyHeight - window.innerHeight;
    var maxAllowableDistancePerScroll =  scrollMax / 7;

    // Scale the scroll range to a simple timeline range
    var scaleScroll = $timeline([
      [0, 0],
      [scrollMax, stateCount * rangePerState]
    ]);

    var scrollPosition = window.pageYOffset;
    var scrollDistanceTraveled = scrollPosition - start.scrollPosition;

    // If the scroll distance exceeds the max allowable distance, return
    // the starting scroll positon + the max distance
    if (Math.abs(scrollDistanceTraveled) > maxAllowableDistancePerScroll) {
      var delta = scrollDistanceTraveled > 0
        ? maxAllowableDistancePerScroll
        : -maxAllowableDistancePerScroll;
      var scaled = scaleScroll(start.scrollPosition + delta);
      var rounded = Math.round(scaled / 50) * 50;
      return rounded;
    }

    return scaleScroll(scrollPosition);
  }

  function determineState(t) {
    for (var i = 0; i < scrollStates.length; i++) {
      var state = scrollStates[i];
      if (t <= state.data.scrollTimelineMax) {
        return state.name;
      }
    }
    return "end";
  }

/*--------------------------------------------------------------*/


  $rootScope.$on('$stateChangeSuccess', function(e) {
    determineScrollPositionFromState();

    var t = $state.current.data.scrollTimelineMax;
    $rootScope.scrollProgress.set(t - 50, { duration: 500 });
  });


  function determineScrollPositionFromState() {
    for (var i = 0; i < scrollStates.length; i++) {
      var state = scrollStates[i];
      if ($state.current.name === state.name) {
        // Set the scroll to half past the beginning of state range
        var halfOfRange = rangePerState / 2;
        var halfwayPointOfRange = state.data.scrollTimelineMax - rangePerState + halfOfRange;

        var scrollMax = $rootScope.bodyHeight - window.innerHeight;

        var newScrollPosition = $timeline([
          [0, 0],
          [stateCount * rangePerState, scrollMax]
        ])(halfwayPointOfRange);

        window.scrollTo(0, newScrollPosition);

        break;
      }
    }
  }

});
