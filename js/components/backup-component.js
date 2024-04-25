let compoBackup = (function() {
  
  let $ = document.querySelector.bind(document);
  
  let SELF = {
    GetBackupFolderId,
    BackupAndUploadToCloud,
    TaskRestore,
    SetBackupFolderId,
  };
  
  let local = {
    backupFolderId: '',
  };
  
  
  let idGenerator = {
    prefix: '#',
    counter: -1,
    generate: function() {
      this.counter += 1;
      return `${this.prefix}${this.counter}`;
    }
  };
  
  function SetBackupFolderId(id) {
    local.backupFolderId = id;
  }
  
  async function validateBackupFolderId() {
    if (local.backupFolderId == '') {
      await drive.TaskReadAppData();
    }
  }
  
  async function TaskRestore() {
    
    if (!await windog.confirm('Are you sure?')) return;
    
    $('#btn-cloud-restore').disabled = true;
    $('#txt-restore-status').textContent = 'Downloading backup file ...';
    
    await validateBackupFolderId();
    let result = await drive.listFiles([compoBackup.GetBackupFolderId()]);
    let files = result.files;
    files.sort((a,b) => {
        return new Date(a.createdTime) > new Date(b.createdTime) ? -1 : 1;
    });
    let recentFile = files.shift();
    
    await validateBackupFolderId();
    let blob = await drive.TaskDownloadFileById(recentFile.id);
    
    compoGsi.BackupDataToTemp();
    let isClearCompleted = await app.ClearData();
    
    if (!isClearCompleted) {
      $('#btn-cloud-restore').disabled = false;
      $('#txt-restore-status').textContent = 'Failed to clear data';
      return;
    }
    
    $('#txt-restore-status').textContent = 'Restoring data';
    
    await new Promise(resolve => {
      
      let reader = new FileReader();
      reader.onload = async function(evt) {
        await app.ImportDataFromJSON(reader.result);
        compoGsi.RestoreDataFromTemp();
        compoGsi.Commit();
        resolve();
      };
      reader.readAsText(blob);      
          
    });
    
    $('#btn-cloud-restore').disabled = false;
    $('#txt-restore-status').textContent = 'Restore complete';
    
  }
  
  function GetBackupFolderId() {
    return local.backupFolderId;
  }
  
  async function BackupAndUploadToCloud() {
    let blob = await app.ExportDbToBlob();
    
    let fileData = {
      blob,
      name: 'takecode-backup-' + new Date().getTime(),
      mimeType: 'application/json',
    };
    
    $('#btn-cloud-backup').disabled = true;
    $('#txt-backup-status').textContent = 'Backup in progress';
    
    await validateBackupFolderId();
    await drive.TaskUploadFile(fileData, local.backupFolderId);
    
    $('#btn-cloud-backup').disabled = false;
    $('#txt-backup-status').textContent = 'Backup complete';
  }
  
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