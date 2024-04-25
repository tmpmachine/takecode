window.stateManager = (function() {
  
  let SELF = {
    SetBreadcrumb,
    GetBreadcrumb,
  };
  
  let breadcrumbPath = [];
  
  function SetBreadcrumb(path) {
    breadcrumbPath = [path];
  }
  
  function GetBreadcrumb() {
    return breadcrumbPath.join(' > ');
  }
  
  return SELF;
  
})();