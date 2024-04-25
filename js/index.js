const data = [];
let isRunTestAssistScript = (!location.host.includes('pwa.'));

async function initApp() {
  await window.ui.init();
  app.InitSearch();
  compoNotes.OpenDatabase().then(() => {
    runApp();
  });
}

function runApp() {
  
  let workspace = app.GetWorkspaceById(window.appSettings.data.activeWorkspace);
  let pickedLabels = '';
  if (workspace) {
    pickedLabels = workspace.labels;
  }
  uxWorkspace.SetCheckedLabels(pickedLabels.split(','));
  uxWorkspace.DisplayListTags(pickedLabels);
  uxWorkspace.ListWorkspaces();
  uxWorkspace.ListWorkspacesTab();
  uxWorkspace.AttachListeners();
    
  reInitData().then(() => {
    
    if (isRunTestAssistScript) {
      tests.Init();
    }
    
    appSettings.GetComponentData('compoGsi', (data) => compoGsi.InitData(data) );

    // restore last opened workspace and code
    uxWorkspace.RestoreSession(window.appSettings.data.activeWorkspace);
    
  });
}

function reInitData() {
  return new Promise(resolve => {
    let labelsName = window.ui.GetFilteredLabels();
    compoNotes.GetAllData().then(async items => {
      data.length = 0;
      let filter = await compoNotes.GetLabelsIdByName(labelsName);
      items.forEach(item => {
        if (filter.length > 0) {
          if (item.labels && arraysContainCommonElements(item.labels, filter)) {
            data.push(item);
          }
        } else {
          data.push(item);
        }
      });
      resolve();
    });
  });
}

function arraysContainCommonElements(arrA, arrB) {
  // Create a Set to store the elements of array B
  let setB = new Set(arrB);

  // Loop through the elements of array A to check if each element is present in the Set
  for (let i = 0; i < arrA.length; i++) {
    if (setB.has(arrA[i])) {
      return true;
    }
  }

  return false;
}

initApp();