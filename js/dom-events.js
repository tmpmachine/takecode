window.DOMEvents = {
	clickable: {
	  'logout': () => compoGsi.Logout(),
	  'on-workspace-tab-click': (evt) => uiWorkspace.OnClickWorkspaceTab(evt.target),
    'show-add-modal': () => window.ui.ShowModalAddSnippet(),
    'show-modal-add-code': () => window.ui.ShowModalAddCode(),
    'toggle-word-wrap': () => {
      let isWrap = window.appSettings.ToggleWordWrap();
      window.appSettings.save();
      window.ui.ChangeAppState(STATE.codePreviewWrap, isWrap);
    },
	  'add-label': (evt) => window.ui.AddLabel(),
	  'add-workspace': (evt) => uiWorkspace.AddWorkspace(),
	  'add-snippet': (evt) => {
	    let form = evt.target.form;
	    window.ui.addSnippet(form);
	    window.ui.CloseCodeEditMode();
      // document.querySelectorAll('#modal-code')[0].close();      
	  },
	  'update-snippet': (evt) => {
	    let form = evt.target.form;
	    window.ui.updateSnippet(form);
	    window.ui.CloseCodeEditMode();
      // document.querySelectorAll('#modal-code')[0].close();      
	  },
	  'cancel-add-snippet': (evt) => {
	    window.ui.CloseCodeEditMode();
	    window.ui.ResetFormEditCode();
	  },
	  
	  // view section
	  'toggle-section-label': () => window.ui.ToggleSectionLabel(),
	  
	  'on-search-item-click': (evt) => window.ui.OnSearchItemclick(evt.target),
	  'handler-snippet': (evt) => {
      let itemEl = evt.target.closest('[data-is="item"]');
      if (!itemEl) return;
      
      let id = itemEl.dataset.id;
      let form = $('form[data-name="snippet"]');
      let btn = evt.target.closest('.i-btn-action');
      if (!btn) return;
      
       switch (btn.dataset.callback) {
        case 'copy': window.ui.copySnippet(id); break;
        case 'edit': window.ui.editSnippet(form, id); break;
        case 'edit-description': window.ui.TaskEditDescription(form, id); break;
        case 'delete': window.ui.deleteSnippet(id); break;
      }
	  },
	  'workspace-click-handler': (evt) => {
	    if (evt.target.tagName == 'INPUT') {
	      window.ui.SaveCheckedLabels();
  	    reInitData();
	    }
	  },
	  
	  // db related
	  // this is obsolete
	  'import-db': async () => {
	    let input = document.createElement('input');
      input.type ='file';
      input.accept ='.json';
      input.onchange = function() {
        Dexie.import(this.files[0]);
        input.remove();
        windog.alert('Done');
      };
      input.onclick = function() {
        input.remove();
      };
      document.body.append(input);
      input.click();
	  },
	  'import-db-migrate': () => app.ImportData(),
	  
	  // cloud backup
	  'google-authorize': () => compoGsi.RequestToken(),
	  'backup-to-cloud': () => compoBackup.BackupAndUploadToCloud(),
	  'restore-from-cloud': () => compoBackup.TaskRestore(),
	  
	  'delete-data': async () => {
	    if (!await windog.confirm('Are you sure?')) return;
	    
	    let isSuccess = await app.ClearData();
	    
	    if (isSuccess) {
	      windog.alert('Done');
	    } else {
	      windog.alert('Failed');
	    }
	  },
	  
	  // db related
	  'export-db': () => app.ExportDb(),
	  
	  'list-diff-click-handler': (evt) => ui.OnDiffItemClick(evt),
	  'accept-merge': () => ui.ResolveConflictWithIncomingData(),
	  'navigate-screen': (evt) => ui.NavigateScreenByClick(evt),
	  'commit-resolve-conflict': () => ui.CommitResolveConflict(),
	  'handle-click-manual-resolve': (evt) => ui.handleClickManualResolve(evt),
	  
	  'handle-click-list-workspace': (evt) => uiWorkspace.HandleClickListWorkspace(evt),
	},
  
  // input event
  inputCallbacks: {
    'on-workspace-radio-input': (evt) => window.ui.OnWorkspaceRadioInput(evt.target),
  },
  	
	// submit event
	submittable: {
	  'on-submit-snippet-form': (evt) => window.ui.OnSubmitSnippetForm(evt),
	},
	
	// change event
	onchange: {
	  'on-change-editor-type': (evt) => window.ui.editor.OnChangeEditorType(evt.target.value),
	  'on-change-language': (evt) => window.ui.editor.OnChangeLanguage(evt.target.value),
	}
};