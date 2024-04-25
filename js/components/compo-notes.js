let compoNotes = (function() {
  
  let SELF = {
    OpenDatabase,
    AddData,
    AddDataLabel,
    GetData,
    GetAllData,
    GetAllDataLabels,
    UpdateData: TaskUpdateData,
    TaskUpdateData,
    DeleteData,
    GetLabelsIdByName,
    GetLabelsNameById,
    PartialUpdateData,
  };
  
  const DB_NAME = 'takecode-MzY5Nzk3MTM';
  window.DB_NAME = DB_NAME;
  const DB_VERSION = 2;
  const OBJECT_STORE_NAME = 'notes';
  const LABELS_STORE_NAME = 'labels';
  
  
  function OpenDatabase() {
    return new Promise((resolve, reject) => {
      let request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onupgradeneeded = (event) => {
        
        let db = request.result;
        let snippetsStore;
        
        if (db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
          snippetsStore = event.target.transaction.objectStore(OBJECT_STORE_NAME);
        } else {
          snippetsStore = db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
        }
        
        if (!snippetsStore.indexNames.contains('labels')) {
          snippetsStore.createIndex('labels', 'labels', { multiEntry: true });
        }
        
        if (!db.objectStoreNames.contains(LABELS_STORE_NAME)) {
          let labelsStore = db.createObjectStore(LABELS_STORE_NAME, { keyPath: 'id' });
          labelsStore.createIndex('name', 'name', { unique: true });
        }
        
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }
  
  function AddData(data) {
    return new Promise(async (resolve, reject) => {
      let db = await OpenDatabase();
      let transaction = db.transaction([OBJECT_STORE_NAME], 'readwrite');
      let objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      
      let request = objectStore.add(data);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }
  
  function AddDataLabel(data) {
    return new Promise(async (resolve, reject) => {
      let db = await OpenDatabase();
      let transaction = db.transaction([LABELS_STORE_NAME], 'readwrite');
      let objectStore = transaction.objectStore(LABELS_STORE_NAME);
      
      let request = objectStore.add(data);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }
  
  function GetData(id) {
    return new Promise(async (resolve, reject) => {
      let db = await OpenDatabase();
      let transaction = db.transaction([OBJECT_STORE_NAME], 'readonly');
      let objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      
      let request = objectStore.get(id);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }
  
  function GetAllData() {
    return new Promise(async (resolve, reject) => {
      let db = await OpenDatabase();
      let transaction = db.transaction([OBJECT_STORE_NAME], 'readonly');
      let objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      
      let request = objectStore.getAll();
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }
  
  function GetAllDataLabels() {
    return new Promise(async (resolve, reject) => {
      let db = await OpenDatabase();
      let transaction = db.transaction([LABELS_STORE_NAME], 'readonly');
      let objectStore = transaction.objectStore(LABELS_STORE_NAME);
      
      let request = objectStore.getAll();
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }
  
  function TaskUpdateData(data) {
    return new Promise(async (resolve, reject) => {
      let db = await OpenDatabase();
      let transaction = db.transaction([OBJECT_STORE_NAME], 'readwrite');
      let objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      
      let request = objectStore.put(data);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }
  
  function DeleteData(id) {
    return new Promise(async (resolve, reject) => {
      let db = await OpenDatabase();
      let transaction = db.transaction([OBJECT_STORE_NAME], 'readwrite');
      let objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      
      let request = objectStore.delete(id);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }
  
  function GetLabelsIdByName(labelNames) {
    return new Promise(async (resolve, reject) => {
      let db = await OpenDatabase();
      const transaction = db.transaction(LABELS_STORE_NAME, 'readonly');
      const store = transaction.objectStore(LABELS_STORE_NAME);
      const index = store.index('name');
      const labels = [];
  
      let count = labelNames.length;
  
      function onsuccess() {
        if (--count === 0) {
          resolve(labels);
        }
      }
      
      if (count === 0) {
        resolve([]);
      }
  
      labelNames.forEach((name) => {
        const request = index.get(name);
  
        request.onsuccess = () => {
          const label = request.result;
  
          if (label) {
            labels.push(label.id);
          }
  
          onsuccess();
        };
  
        request.onerror = () => {
          reject(request.error);
        };
      });
    });
  }
  
  function GetLabelsNameById(labelIds) {
    return new Promise(async (resolve, reject) => {
      let db = await OpenDatabase();
      const transaction = db.transaction(LABELS_STORE_NAME, 'readonly');
      const store = transaction.objectStore(LABELS_STORE_NAME);
      const labels = [];
  
      if (!labelIds) {
        resolve([]);
        return;
      }
  
      let count = labelIds.length;
  
      function onsuccess() {
        if (--count === 0) {
          resolve(labels);
        }
      }
      
      if (count === 0) {
        resolve([]);
        return;
      }
      
      labelIds.forEach((id) => {
        const request = store.get(id);
  
        request.onsuccess = () => {
          const label = request.result;
  
          if (label) {
            labels.push(label.name);
          }
  
          onsuccess();
        };
  
        request.onerror = () => {
          reject(request.error);
        };
      });
    });
  }
  
  
  function PartialUpdateData(id, updatedFields) {
    return new Promise(async (resolve, reject) => {
      let db = await OpenDatabase();
      let transaction = db.transaction([OBJECT_STORE_NAME], 'readwrite');
      let objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      
      let request = objectStore.get(id);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        let data = request.result;
        if (!data) {
          reject(new Error('Data not found'));
          return;
        }
        for (let field in updatedFields) {
          data[field] = updatedFields[field];
        }
        
        let updateRequest = objectStore.put(data);
        
        updateRequest.onerror = () => {
          reject(updateRequest.error);
        };
        
        updateRequest.onsuccess = () => {
          resolve(updateRequest.result);
        };
      };
    });
  }
  
  return SELF;
  
})();