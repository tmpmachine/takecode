let compoDiff = (function() {
  
  let SELF = {
    Add,
    GetAll,
    GetAllUnresolved,
    GetAllResolved,
    GetById,
    TakeIncoming,
    TakeSource,
    RemoveById,
    CreateCopyIncoming,
    TakeSourceManually,
  };
  
  let data = {
    conflicts: []
  };
  
  
  let idGenerator = {
    prefix: '#',
    counter: -1,
    generate: function() {
      this.counter += 1;
      return `${this.prefix}${this.counter}`;
    }
  };
  
  function Add(itemData = { source, incoming }) {
    let item = {
      id: idGenerator.generate(),
      source: itemData.source,
      incoming: itemData.incoming,
      accepted: {},
      isResolved: false,
    };
    data.conflicts.push(item);
    
    return item;
  }
  
  function GetAll() {
    return data.conflicts;
  }
  
  function GetById(id) {
    let item = GetAll().find(x => x.id == id);
    if (item !== undefined) return item;
    
    return null;
  }
  
  function GetAllUnresolved() {
    return GetAll().filter(x => !x.isResolved);
  }
  
  function GetAllResolved() {
    return GetAll().filter(x => x.isResolved);
  }
  
  
  function setStatusResolved(id) {
    let item = GetById(id);
    item.isResolved = true;
  }
    
  function TakeSource(id) {
    let item = GetById(id);
    item.accepted = __clearReference(item.source);
    setStatusResolved(id);
  }
  
  function TakeIncoming(id) {
    let item = GetById(id);
    item.accepted = __clearReference(item.incoming);
    setStatusResolved(id);
  }
  
  function TakeSourceManually(id, data) {
    let item = GetById(id);
    item.accepted = __clearReference(data);
    setStatusResolved(id);
  }
  
  function CreateCopyIncoming(id) {
    let item = GetById(id);
    return __clearReference(item.incoming);
  }
  
  function __clearReference(data) {
    return JSON.parse( JSON.stringify(data) );
  }
    
  function RemoveById(id) {
    let delIndex = getIndexById(id);
    if (delIndex < 0) return null;
    
    let item = GetAll().splice(delIndex, 1);
    
    return item[0];
  }
   
    
  function getIndexById(id) {
    
    return GetAll().findIndex(item => item.id == id);
  }
  
  return SELF;
  
})();