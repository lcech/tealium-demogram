/**
 * Main method
 * @param originalQueue {Object} object containing queue of previously notified events
 */
measure = function (originalQueue) {
  /**
   * New function to operate the gathered data
   * @method measureInterface
   * @param data {object} Object with data to measure
   */
  var measureInterface = function (data) {
    data = data || {};
    if (typeof data.event === 'undefined') {
      data.event = 'pageView';
    }

    //data._timestamp = new Date().getTime();

    window.digitalData = measureInterface._deepMerge(window.digitalData, data);
    window.digitalData._log = window.digitalData._log || [];
    window.digitalData._log.push(data);

    measureInterface.process(data);

    console.log('MEASURE: Event captured:');
    console.log('MEASURE: ' + JSON.stringify(data, null, 4).replace(/\n/g, '\nMEASURE: '));
    console.log('MEASURE: ' + '---------------------------------------------');
  };

  /**
   * Events queue
   * @type {*|Array}
   * @public
   */
  measureInterface.q = originalQueue.q || [];

  /**
   * Function to merge objects recursively
   * @param target
   * @param src
   * @returns {boolean|*|Boolean|Array|{}}
   * @private
   */
  measureInterface._deepMerge = function (target, src) {
    var isArray = Array.isArray(src);
    var dst = isArray && src || {};

    if (!isArray) {
      if (target && typeof target === 'object') {
        Object.keys(target).forEach(function (key) {
          dst[key] = target[key];
        });
      }
      Object.keys(src).forEach(function (key) {
        if (typeof src[key] !== 'object' || !src[key]) {
          dst[key] = src[key];
        } else {
          if (!target[key]) {
            dst[key] = src[key];
          } else {
            dst[key] = measureInterface._deepMerge(target[key], src[key]);
          }
        }
      });
    }

    return dst;
  };

  /**
   * Default measure process function to override
   * @method process
   * @private
   */
  measureInterface.process = function (data) {
    switch (data.event) {
    default:
      utag.view(data);
      break;
    }
  };

  for (var i = measureInterface.q.length; i > 0; i--) {
    measureInterface(measureInterface.q.shift()[0]); // Process the previously inserted data
  }

  return measureInterface;
}(measure);


/*
 * Init Youtube Iframe API
 */
(function() {
  var tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
})();


/*
 * Global Variable for available Youtube players
 */
var youtubePlayers = [],
  youtubePlayerIframes = [];

/*
 * Refresh iframes without enabled API
 */
function refreshIframeAPI() {
  for (var iframes = document.getElementsByTagName("iframe"), i = iframes.length; i--;) {
    if (/youtube.com\/embed/.test(iframes[i].src)) {
      youtubePlayerIframes.push(iframes[i]);
      if (iframes[i].src.indexOf('enablejsapi=') === -1) {
        iframes[i].src += (iframes[i].src.indexOf('?') === -1 ? '?' : '&') + 'enablejsapi=1';
      }
    }
  }
}

function onYouTubeIframeAPIReady() {
  refreshIframeAPI();
  for (var i = 0; i < youtubePlayerIframes.length; i++) {
    youtubePlayers.push(new YT.Player(youtubePlayerIframes[i], {
      events: {
        "onStateChange": onPlayerStateChange
      }
    }));
  }
}

function onPlayerStateChange(event) {
  var videoData;
  videoData = event.target.getVideoData();
  switch (event.data) {
  case YT.PlayerState.PLAYING:
    measure({event: "videoPlay", video: {id: videoData.video_id, title: videoData.title}});
    break;
  case YT.PlayerState.PAUSED:
    measure({event: "videoPause", video: {id: videoData.video_id, title: videoData.title, timePlayed: event.target.getCurrentTime()}});
    break;
  case YT.PlayerState.ENDED:
    measure({event: "videoEnd", video: {id: videoData.video_id, title: videoData.title, timePlayed: event.target.getCurrentTime()}});
    break;
  }
}
