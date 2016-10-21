/*global angular, navigator*/

(function () {
  'use strict';

  angular
    .module('angular-click-outside', [])
    .directive('clickOutside', ['$document', '$parse', '$timeout', clickOutside]);

  function clickOutside($document, $parse, $timeout) {
    return {
      restrict: 'A',
      link: function ($scope, elem, attr) {

        // postpone linking to next digest to allow for unique id generation
        $timeout(function () {
          var classList = (attr.outsideIfNot !== undefined) ? attr.outsideIfNot.split(/[ ,]+/) : [],
            fn;
          var iframes = {};
          var newIframe = false;

          // add the elements id so it is not counted in the click listening
          if (attr.id !== undefined) {
            classList.push(attr.id);
          }

          $scope.$watch(function() {

            $document.find('iframe').each(function() {
              if (!iframes[this.getAttribute('id')]) {
                iframes[this.getAttribute('id')] = angular.element(this.contentWindow.document);
                newIframe = true;
              }
            });

            if (newIframe) {
              if (_hasTouch()) {
                addListener.on('touchstart', eventHandler);
              }

              addListener('click', eventHandler);
              newIframe = false;
            }
          });

          function eventHandler(e) {
            var i,
              element,
              r,
              id,
              classNames,
              l;

            // check if our element already hidden and abort if so
            if (angular.element(elem).hasClass("ng-hide")) {
              return;
            }

            // if there is no click target, no point going on
            if (!e || !e.target) {
              return;
            }

            // loop through the available elements, looking for classes in the class list that might match and so will eat
            for (element = e.target; element; element = element.parentNode) {
              id = element.id,
                classNames = element.className,
                l = classList.length;

              // Unwrap SVGAnimatedString classes
              if (classNames && classNames.baseVal !== undefined) {
                classNames = classNames.baseVal;
              }

              // if there are no class names on the element clicked, skip the check
              if (classNames || id) {

                // console.log('classNames: ' + classNames);

                // loop through the elements id's and classnames looking for exceptions
                for (i = 0; i < l; i++) {
                  //prepare regex for class word matching
                  r = new RegExp('\\b' + classList[i] + '\\b');

                  //  console.log('classList: ' + classList[i]);

                  // check for exact matches on id's or classes, but only if they exist in the first place
                  if ((id !== undefined && id === classList[i]) || (classNames && r.test(classNames))) {
                    // now let's exit out as it is an element that has been defined as being ignored for clicking outside
                    return;
                  }
                }
              }
            }

            // if we have got this far, then we are good to go with processing the command passed in via the click-outside attribute
            $timeout(function () {
              fn = $parse(attr['clickOutside']);
              fn($scope);
            });
          }

          // if the devices has a touchscreen, listen for this event
          if (_hasTouch()) {
            addListener('event', eventHandler)
            $document.on('touchstart', eventHandler);
          }

          // still listen for the click event even if there is touch to cater for touchscreen laptops
          $document.on('click', eventHandler);
          addListener('click', eventHandler)

          // when the scope is destroyed, clean up the documents event handlers as we don't want it hanging around
          $scope.$on('$destroy', function () {
            if (_hasTouch()) {
              $document.off('touchstart', eventHandler);
            }

            $document.off('click', eventHandler);
          });

          function addListener(eventName, listener) {
            for (var index in iframes) {
              if (!iframes.hasOwnProperty(index)) {
                continue;
              }

              iframes[index].on(eventName, listener);
            }
          }

          // private function to attempt to figure out if we are on a touch device
          function _hasTouch() {
            // works on most browsers, IE10/11 and Surface
            return 'ontouchstart' in window || navigator.maxTouchPoints;
          };
        });
      }
    };
  }
})();
