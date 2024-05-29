let compoWorkspace = (function() {
  
  let SELF = {
    GetAll,
    Commit,
    UpdateItemById,
    GetItemById,
    DeleteItemById,
    Init,
  };
  
  let data = {
    items: []
  };
  
  function Init() {
    data.items = clearReference(window.appSettings.data.workspaces);
  }

  function DeleteItemById(id) {
    let delIndex = GetItemIndexById(id);
    if (delIndex < 0) return null;
    
    let item = data.items.splice(delIndex, 1);
    return item;
  }

  function GetItemIndexById(id) {
    let items = GetAll();
    return items.findIndex(item => item.id == id);
  }

  function GetAll() {
    return data.items;
  }

  function clearReference(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function GetItemById(id) {
    let item = GetAll().find(x => x.id == id);
    if (item !== undefined) return item;
    
    return null;
  }
  
  function UpdateItemById(id, incomingData) {
    let item = GetItemById(id);
    if (!item) return null;
    
    for (let key in incomingData) {
      if (typeof(item[key]) != 'undefined' && typeof(item[key]) == typeof(incomingData[key])) {
        item[key] = incomingData[key];
      }
    }
    
    return item;
  }
  
  function Commit() {
    appSettings.data.workspaces = clearReference(data.items);
  }
  
  return SELF;
  
})();