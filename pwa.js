// cache only if service worker is available
(function() {

  if (typeof(navigator) !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('../sw.js').then(function(swo) {
      // pwaCacher.TaskCacheVersionChecking();
    }).catch(function(e) {
      console.error(e);
    });
  }
  
})();