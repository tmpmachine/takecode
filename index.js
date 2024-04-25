;(function() {
  
  "use-strict";
  
  window.componentLoader.load([
    {
      urls: [
        "js/view-states.js",
        "js/vendors/windog/windog.js",
        "js/vendors/view-state-util/view-state-util.js",
      ],
      callback: function() {
        viewStateUtil.Init(viewStatesMap); 
      },
    },
    {
      urls: [
        "https://cdn.jsdelivr.net/gh/ccampbell/mousetrap@v1.6.5/mousetrap.min.js",
        "https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ace.js",
        "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.7.0/build/highlight.min.js",
        "https://cdn.jsdelivr.net/gh/tmpmachine/lsdb.js@v1.0.0/lsdb.min.js",
        "https://cdn.jsdelivr.net/gh/tmpmachine/templateslot.js@v1.0.0/templateslot.min.js",
        "https://cdn.jsdelivr.net/gh/tmpmachine/statelist-utility@v1.0.2/statelist.min.js",
        "https://unpkg.com/dexie@3.2.2",
      ],
      callback: function() {},
    },
    {
      urls: [
        "https://unpkg.com/dexie-export-import@1.0.3",
      ],
    },
    {
      urls: [
        "https://cdnjs.cloudflare.com/ajax/libs/fuse.js/6.6.2/fuse.min.js",
        "js/dom-events.js",
        "js/util.js",
        "js/ui.js",
        "js/components/compo-diff.js",
        "js/components/compo-notes.js",
        "js/components/compo-workspace.js",
        "js/components/state-manager.js",
        "js/test.js",
        "js/app-data.js",
        "js/app.js",
      ],
    },
    {
      urls: [
        "js/index.js",
      ],
      callback: function() { 
      },
    },
    {
      urls: [
        "js/drive-api.js",
        "js/components/backup-component.js",
      ],
    },
  ]);
  
})();