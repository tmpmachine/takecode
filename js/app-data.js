window.appSettings = (function() {
  
  let storageName = 'takecode-appdata-MzY5Nzk3MTM';
  let lsdb = new Lsdb(storageName, {
    root: {
      dataVersion: 2,
      
      codePreview: {
        wordWrap: false,
      },
      activeWorkspace: '',
      workspaces: [],
      workspacesTab: [],
      
      // previous session
      session: {
        codeId: '',
        workspaceLastOpenedCode: [],
      },
      
      // components
      components: {
        compoGsi: {},
      }
    },
  });
  
  let SELF = {
    save,
    Save: save,
    reset,
    SetLastOpenedCode,
    ToggleWordWrap,
    AddWorkspace,
    UpdateWorkspace,
    SetActiveWorkspace,
    SetComponentData,
    GetComponentData,
    DeleteWorkspace,
    data: lsdb.data,
  };
  
  // data structure upgrade
  updateDataStructure();
  
  function updateDataStructure() {
    try {
      let existingData = JSON.parse(localStorage.getItem(storageName));
      if (!existingData) return;
      
      let currentVer = existingData.dataVersion;
      
      if (currentVer == undefined || currentVer < 2) {
        if (lsdb.data.workspaces.length > 0) {
          // set workspace id
          let uniqueNumber = new Date().getTime();
          for (let data of lsdb.data.workspaces) {
            data.id = uniqueNumber.toString();
            uniqueNumber--;
          }
          
          // set active workspace id
          lsdb.data.activeWorkspace = lsdb.data.workspaces.find(item => item.name == lsdb.data.activeWorkspace).id;
          
          // change pinned workspace data from name to id
          lsdb.data.workspacesTab = lsdb.data.workspacesTab.map(workspaceName => lsdb.data.workspaces.find(workspace => workspace.name == workspaceName).id);
        }
      }
    } catch(e) {
      console.error('app data version upgrade failed.', e);  
    }
  }
  
  
  function save() {
    lsdb.save();
  }
  
  function reset() {
    lsdb.reset();
    SELF.data = lsdb.data;
  }
  
  function SetLastOpenedCode(id) {
    lsdb.data.session.codeId = id.toString();
    // lsdb.data.session.codeId = id.toString();
    
    if (lsdb.data.activeWorkspace != '') {
      setWorkspaceLastOpenedCode(lsdb.data.session.codeId, lsdb.data.activeWorkspace);
    }
  }
  
  function setWorkspaceLastOpenedCode(codeId, workspaceId) {
    let existingDataIndex = lsdb.data.session.workspaceLastOpenedCode.findIndex(x => x.workspaceId == workspaceId);
    let workspaceSessionData = {
      codeId,
      workspaceId,
    };
    
    if (existingDataIndex < 0) {
      lsdb.data.session.workspaceLastOpenedCode.push(workspaceSessionData);
    } else {
      lsdb.data.session.workspaceLastOpenedCode[existingDataIndex].codeId = codeId;
    }
  }
  
  function SetComponentData(componentKey, noReferenceData) {
    if (!lsdb.data.components[componentKey]) return false;
    
    lsdb.data.components[componentKey] = noReferenceData;
    return true;
  }
  
  function GetComponentData(componentKey, callback) {
    if (!lsdb.data.components[componentKey]) return false;
    
    callback(clearReference(lsdb.data.components[componentKey]));
    return true;
  }
  
  function clearReference(data) {
    return JSON.parse(JSON.stringify(data));
  }
  
  function SetActiveWorkspace(name) {
    lsdb.data.activeWorkspace = name;
  }
  
  function UpdateWorkspace(workspaceId, labels) {
    let workspace = getWorkspaceById(workspaceId);
    if (!workspace) return;
    
    workspace.labels = labels;
  }
  
  function getWorkspaceById(id) {
    return lsdb.data.workspaces.find(x => x.id == id);
  }
  
  function AddWorkspace(name, labels) {
    let uniqueNumber = new Date().getTime();
    let id = uniqueNumber.toString();
    let data = {
      id,
      name,
      labels,
    };
    lsdb.data.workspaces.push(data);
    return data;
  }
  
  function DeleteWorkspace(name) {
    let index = lsdb.data.workspaces.findIndex(x => x.name == name);
    lsdb.data.workspaces.splice(index, 1);
  }
  
  function ToggleWordWrap() {
    let val = !lsdb.data.codePreview.wordWrap;
    lsdb.data.codePreview.wordWrap = val;
    return val;
  }
  
  return SELF;
  
})();