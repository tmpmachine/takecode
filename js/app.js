let app = (function() {

  let SELF = {
    InitSearch,
    
    // data management
    ExportDb,
    ExportDbToBlob,
    ImportData,
    ImportDataFromJSON,
    ClearData,
    
    GetWorkspaceById,
  };
  
  function GetWorkspaceById(id) {
    return window.appSettings.data.workspaces.find(x => x.id == id);
  }
  
  async function ImportData() {
    
    let input = document.createElement('input');
    input.type ='file';
    input.accept ='.json';
    input.onchange = function() {
      this.files[0].text().then(async data => {
        let success = ImportDataFromJSON(data);
        if (success) {
          windog.alert('Done');
        }
      });
      input.remove();
    };
    input.onclick = function() {
      input.remove();
    };
    document.body.append(input);
    input.click();
      
  }
  
  async function ImportDataFromJSON(json) {
    
    let d = JSON.parse(json);
    let mappingLabels = [];
    
    // # import labels
    for (let item of d.idbData.data.data) {
      if (item.tableName == 'labels') {
        
        let existingLabels  = await compoNotes.GetAllDataLabels();
        
        for (let d of item.rows) {
          
          // check existing
          let matchedIndex = existingLabels.findIndex(x => x.id == d.id);
          if (matchedIndex >= 0) {
            console.log('skipped label')
            continue;
          }
          
          await compoNotes.AddDataLabel(d)
          console.log('label added')
        }
      } 
    }
    
    // # import snippets
    for (let item of d.idbData.data.data) {
      if (item.tableName == 'notes' || item.tableName == 'my-object-store') {
        
        let existingSnippets = await compoNotes.GetAllData();
        
        for (let d of item.rows) {
          
          // check existing
          let matchedIndex = existingSnippets.findIndex(x => x.id == d.id);
          if (matchedIndex >= 0) {
            let existingDataHash = await getHash(JSON.stringify(existingSnippets[matchedIndex]));
            let newDataHash = await getHash(JSON.stringify(d));
            if (existingDataHash != newDataHash) {
              
              // add conflict
              compoDiff.Add({
                source: existingSnippets[matchedIndex],
                incoming: d,
              });
              
            }
            console.log('skipped notes');
            continue;
          }
          
          await compoNotes.AddData(d);
          console.log('notes added');
        }
      }
    }
    
    // # restore workspace
    let existingWorkspaces = appSettings.data.workspaces;
    for (let item of d.workspaces) {
      let isExist = existingWorkspaces.find(x => x.id == item.id)
      if (isExist) {
        console.log('skipped workspace');
        continue;
      }
      appSettings.data.workspaces.push(item);
      console.log('workspace added');
    }
    
    appSettings.save();
    
    let diffCount = compoDiff.GetAll().length;
    if (diffCount > 0) {
      ui.NavigateScreen('screen-diff');
      ui.ListAllDiff();
    }
    
    return true;
    
  }
  
  async function ClearData() {
    return new Promise(async resolve => {
	    
	    let theDBName = window.DB_NAME;
      let theDB = new Dexie(theDBName);
      
      // Close the database connection
      await theDB.close();

      theDB.delete().then(() => {
	      window.appSettings.reset();
	      resolve(true);
      }).catch(error => {
        console.log(error);
	      resolve(false);
      });
      
    });
  }
  
  function getHash(jsonString) {
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);
  
    // Use subtle crypto API if available (modern browsers)
    if (window.crypto && window.crypto.subtle) {
      return window.crypto.subtle.digest('SHA-256', data)
        .then(buffer => {
          const hashArray = Array.from(new Uint8Array(buffer));
          return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
        })
        .catch(error => {
          console.error('Error calculating hash:', error);
        });
    } else {
      // Fallback for browsers that do not support subtle crypto API
      const hashBuffer = new TextEncoder('utf-8').encode(jsonString);
      const hashArray = Array.from(new Uint8Array(crypto.subtle.digestSync('SHA-256', hashBuffer)));
      return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    }
  }
  
  async function ExportDb() {
    let blob = await ExportDbToBlob();
    if (!blob) return;
    
    let el = document.createElement('a');
    let url = URL.createObjectURL(blob);
    el.href = url;
    el.download = `codecoper-backup-${new Date().toISOString().split('T')[0]}.json`;
    el.onclick = function() {
      el.remove();
    };
    document.body.append(el);
    el.click();
  }
  
  async function ExportDbToBlob() {
    let theDBName = window.DB_NAME;
    let theDB = new Dexie(theDBName);
    
    let {verno, tables} = await theDB.open();
    theDB.close();
    await new Promise((resolve) => resolve());
    
    theDB = new Dexie(theDBName);
    
    theDB.version(verno).stores(tables.reduce((p,c) => {p[c.name] = c.schema.primKey.keyPath || ""; return p;}, {}));
    theBlob = await theDB.export();
    
    let mergedData = await new Promise(resolve => {
      let reader = new FileReader();
      reader.onload = async function(evt) {
        try {
          let mergedData = {
            idbData: JSON.parse(reader.result),
            workspaces: appSettings.data.workspaces,
          };
          resolve(mergedData);
        } catch (e) {
          console.log(e);
          resolve(null);
        }
      };
      reader.readAsText(theBlob);
    });
    
    if (mergedData == null) {
      windog.alert('Failed');
      return;
    }
    
    let blob = new Blob([JSON.stringify(mergedData)], { type: 'application/json' });
    return blob;
  }
  
  function OnePress() {
    
    let pressed = {};
    
    function watch(type, key) {
      if (type == 'keydown') {
        if (pressed[key]) {
          
        } else {
          pressed[key] = true;
          return true;
        }
      } else {
        pressed[key] = false;
      }
      
      return false;
    }
    
    function blur() {
      pressed = {};
    }
    
    return {
      watch,
      blur,
    };
    
  }
  
  let onePress = OnePress();
  
  function InitSearch() {
    $('#search').addEventListener('keyup', async evt => {
      if (evt.key.includes('Arrow')) return;
      
      await searchData(evt.target.value);
    });
    
    window.addEventListener('keydown', searchKeyHandler);
    window.addEventListener('keyup', searchKeyHandler);
  }
  
  function searchKeyHandler(evt) {
    switch (evt.key) {
      case 'ArrowUp': arrowUp(evt); break;
      case 'ArrowDown': arrowDown(evt); break;
    }
  }
  
  function arrowDown(evt) {
    if (onePress.watch(evt.type, evt.key)) {
      focusDown(evt);
    } else {
      if (evt.target.matches('[data-callback="preview-code"]')) {
        evt.preventDefault();
      }
    }
  }
  
  function arrowUp(evt) {
    if (onePress.watch(evt.type, evt.key)) {
      focusUp(evt);
    } else {
      if (evt.target.matches('[data-callback="preview-code"]')) {
        evt.preventDefault();
      }
    }
  }
  
  function focusDown(evt) {
    if (evt.target.matches('#search')) {
      let nextEl = $('#recent .i-item [data-callback="preview-code"]');
      nextEl.focus();
      evt.preventDefault();
    } else if (evt.target.matches('[data-callback="preview-code"]')) {
      evt.preventDefault();
      let nextEl = evt.target.closest('.i-item').nextElementSibling;
      if (nextEl) {
        nextEl = nextEl.querySelector('[data-callback="preview-code"]');
        nextEl.focus();
      }
    }
  }
  
  function focusUp(evt) {
    if (evt.target.matches('[data-callback="preview-code"]')) {
      evt.preventDefault();
      let nextEl = evt.target.closest('.i-item').previousElementSibling;
      if (nextEl) {
        nextEl = nextEl.querySelector('[data-callback="preview-code"]');
        nextEl.focus();
      }
    }
  }
  
  async function searchData(val) {
    let matches = await search(val);
    if (Object.is(matches, null)) {
      window.ui.displayData(null);
    } else {
      window.ui.displayData(matches);
    }
  }
  
  return SELF;
  
})();