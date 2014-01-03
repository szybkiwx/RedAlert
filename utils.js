// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();


/* Recipe from JavaScript Allonge */
var __slice = Array.prototype.slice;

function variadic (fn) {
  var fnLength = fn.length;

  if (fnLength < 1) {
    return fn;
  }
  else if (fnLength === 1)  {
    return function () {
      return fn.call(
        this, __slice.call(arguments, 0))
    }
  }
  else {
    return function () {
      var numberOfArgs = arguments.length,
          namedArgs = __slice.call(
            arguments, 0, fnLength - 1),
          numberOfMissingNamedArgs = Math.max(
            fnLength - numberOfArgs - 1, 0),
          argPadding = new Array(numberOfMissingNamedArgs),
          variadicArgs = __slice.call(
            arguments, fn.length - 1);

      return fn.apply(
        this, namedArgs
              .concat(argPadding)
              .concat([variadicArgs]));
    }
  }
};

var extend = variadic( function (consumer, providers) {
  var key,
      i,
      provider;
  
  for (i = 0; i < providers.length; ++i) {
    provider = providers[i];
    for (key in provider) {
      if (provider.hasOwnProperty(key)) {
        consumer[key] = provider[key]
      }
    }
  }
  return consumer
});


(function() {
    var resourceCache = {};
    var loading = [];
    var readyCallbacks = [];

    // Load an image url or an array of image urls
    function load(urlOrArr) {
        if(urlOrArr instanceof Array) {
            urlOrArr.forEach(function(url) {
                _load(url);
            });
        }
        else {
            _load(urlOrArr);
        }
    }

    function _load(url) {
        if(resourceCache[url]) {
            return resourceCache[url];
        }
        else {
            var img = new Image();
            img.onload = function() {
                resourceCache[url] = img;

                if(isReady()) {
                    readyCallbacks.forEach(function(func) { func(); });
                }
            };
            resourceCache[url] = false;
            img.src = url;
        }
    }

    function get(url) {
        return resourceCache[url];
    }

    function isReady() {
        var ready = true;
        for(var k in resourceCache) {
            if(resourceCache.hasOwnProperty(k) &&
               !resourceCache[k]) {
                ready = false;
            }
        }
        return ready;
    }

    function onReady(func) {
        readyCallbacks.push(func);
    }

    window.resources = { 
        load: load,
        get: get,
        onReady: onReady,
        isReady: isReady
    };
})();


Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};