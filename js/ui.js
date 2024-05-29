const STATE = {
  editSnippet: '--snippet-edit',
  editCode: '--code-edit',
  codePreviewWrap: '--code-preview-wrap',
};

window.ui = (function () {
  
  let SELF = {
    ShowModalForm,
    
    SaveCheckedLabels,
    AddLabel,
    NavigateScreen,
    NavigateScreenByClick,
    
    // search results
    OnSearchItemclick,
    
    SetEditorText,
    SetFocusEl,
    GetFilteredLabels,    
    OnSubmitSnippetForm,
    
    // modals
    ShowModalAddCode,
    ShowModalAddSnippet,
    
    // main editor
    CloseCodeEditMode,
    ResetFormEditCode,
    editSnippet: EditSnippet,
    TaskEditDescription,
    
    // tab and workspaces
    OnWorkspaceRadioInput,
    
    // to do: uppercase first
    ChangeAppState: changeAppState,
    init: Init,
    
    // view sections
    ToggleSectionLabel: () => { $('[data-view-parent="workspace"]').stateList.toggle('--show-label'); },
    
    // editor
    editor: {
      OnChangeEditorType,
      OnChangeLanguage,
    },
    
    ListAllDiff,
    OnDiffItemClick,
    ResolveConflictWithIncomingData,
    CommitResolveConflict,
    handleClickManualResolve,
    GetFilteredLabelsStr,
    ToggleInsertSnippet,
    
    getCodeById,
    SetSearchResultItemActiveState,
    ListSnippets,
    UpdateBreadcrumb,
    AppendSearchResultPartial,
  };
  
  async function CommitResolveConflict() {
    let items = compoDiff.GetAllResolved();
    
    for (let item of items) {
      await compoNotes.TaskUpdateData(item.accepted);
    }
    
    NavigateScreen('screen-main'); 
  }
  
  function handleClickManualResolve(evt) {
    let action = evt.target.dataset.action;
    if (!action) return;
    
    let itemEl = evt.target.closest('[data-kind="item"]');
    let id = itemEl.dataset.id;
    
    switch (action) {
      case 'remove-snippet':
        itemEl.remove();
        break;
      case 'take-snippet':
        $('.container-conflict-resolver [data-jss="#incoming"] .container-list-code').append(itemEl)
        break;
    }
  }
  
  function ListAllDiff() {
    
    let items = compoDiff.GetAllUnresolved();
    
    $('.container-list-diff').innerHTML = '';
	  let docFrag = document.createDocumentFragment();
    
    for (let item of items) {
      let data = {
        id: item.id,
        title: item.source.title,
      };
      let el = window.templateSlot.fill({
    	  data, 
    	  template: document.querySelector('#tmp-diff-item').content.cloneNode(true), 
    	});
    	
    	el.querySelector('[data-kind="item"]').dataset.id = data.id;
    	
    	docFrag.append(el);    
    }
    
    $('.container-list-diff').append(docFrag);
    
  }
  
  async function OnDiffItemClick(evt) {
    
    let action = evt.target.dataset.action;
    if (!action) return;
    
    let id = evt.target.closest('[data-kind="item"]').dataset.id;
    
    switch (action) {
      case 'solve-manually':
        sessionStorage.setItem('conflictid', id)
        displayConflictingInfo(id);
        break;
      case 'take-source':
        compoDiff.TakeSource(id);
        ListAllDiff();
        break;
      case 'take-incoming':
        compoDiff.TakeIncoming(id);
        ListAllDiff();
        break;
    }
    
  }
  
  function displayConflictingInfo(id) {
    let item = compoDiff.GetById(id);
    
    {
      let form = $('.container-conflict-resolver [data-jss="#source"]');
      displayFormConflictItem(form, 'source', item.source)
    }
    {
      let form = $('.container-conflict-resolver [data-jss="#incoming"]');
      displayFormConflictItem(form, 'incoming', item.incoming)
    }
    
  }
  
  function displayFormConflictItem(form, selector, data) {
    
    for (let inputEl of form.querySelectorAll(`[data-name="${selector}"] [data-slot-text]`)) {
      
      let key = inputEl.dataset.slotText;
      
      if (typeof(data[key]) != 'undefined') {
        if (key == 'labels') {
          if (typeof(data[key]) == 'object') {
            inputEl.value = data[key].join(', ');
          }
        } else {
          inputEl.value = data[key];
        }
      }
  
    }
    
    displayListSnippet(form, data.content);
    
  }
  
  function displayListSnippet(formEl, items) {
    
    formEl.querySelector('.container-list-code').innerHTML = '';
    if (items === undefined) return;
    
	  let docFrag = document.createDocumentFragment();
    
    for (let item of items) {
      let data = {
        id: item.id,
        keywords: item.keywords,
        language: item.language,
        type: item.type,
        content: item.content,
      };
      let el = window.templateSlot.fill({
    	  data, 
    	  template: document.querySelector('#tmp-diff-item-snippet').content.cloneNode(true), 
    	});
    	
    	
    	// fill input data
    	for (let inputEl of el.querySelectorAll(`[data-slot-text]`)) {
      
        let key = inputEl.dataset.slotText;
        
        if (typeof(data[key]) != 'undefined') {
          inputEl.value = data[key];
        }
    
      }
    	
    	el.querySelector('[data-kind="item"]').dataset.id = data.id;
    	
    	docFrag.append(el);    
    }
    
    formEl.querySelector('.container-list-code').append(docFrag);
    
  }
  
  
  async function ResolveConflictWithIncomingData() {
    let activeDiffId = sessionStorage.getItem('conflictid');
    let item = compoDiff.GetById(activeDiffId);
    if (item == null) return;
    
    let data = compoDiff.CreateCopyIncoming(activeDiffId);
    let containerEl = $('.container-conflict-resolver [data-jss="#incoming"]');
    let form = containerEl.querySelector('[data-name="incoming"]');
    
    for (let inputEl of form.querySelectorAll(`[data-slot-text]`)) {
      let key = inputEl.dataset.slotText;
      
      if (typeof(data[key]) != 'undefined') {
        if (key == 'labels') {
          data[key] = inputEl.value.trim('').split(',').map(x => x.trim());
        } else {
          data[key] = inputEl.value;
        }
      }
    }
    
    // update snippets data
    {
      let snippetEls = containerEl.querySelectorAll('[data-jss=".diff-item-snippet"]');
      let ids = [];
      for (let el of snippetEls) {
        
        let formData = {}
        
        for (let inputEl of el.querySelectorAll(`[data-slot-text]`)) {
          let key = inputEl.dataset.slotText;
          formData[key] = inputEl.value;
        }
        
        let id = formData['id'];
        ids.push(id)
        let snippet = data.content.find(x => x.id == id);
        if (snippet) {
          for (let key in formData) {
            if (typeof(snippet[key]) != 'undefined') {
              snippet[key] = formData[key];
              console.log('changed')
            }
          }
        } else {
          data.content.push(formData)
        }
        
      }
      
      for (let i=0; i<data.content.length; i++) {
        let item = data.content[i];
        if (!ids.includes(item.id)) {
          data.content.splice(i, 1)
          console.log('deleted')
        }
      }
      
    }
    
    compoDiff.TakeSourceManually(activeDiffId, data);
    
    ListAllDiff();
    
  }


  function NavigateScreenByClick(evt) {
    let targetEl = evt.target.closest('[data-navigate-name-target]');
    if (!targetEl) return;
    
    let targetNavigateName = targetEl.dataset.navigateNameTarget;
    if (!targetNavigateName) return;
    
    NavigateScreen(targetNavigateName);
  }
  
  function NavigateScreen(targetNavigateName) {
    
    let activeClass = 'is-active';
    
    // screen elements check
    let activeScreenEl = $(`.container-screen.${activeClass}`);
    let targetScreenEl = $(`.container-screen[data-navigate-name="${targetNavigateName}"]`);
    if (!targetScreenEl || !activeScreenEl) return;
    
    activeScreenEl.classList.remove(activeClass);
    targetScreenEl.classList.add(activeClass);
    
  }
  
  function OnChangeEditorType(value) {
    if (value == 'code') {
      setEditorMode($('#sel-editor-language').value);
    } else {
      setEditorMode();
    }
  }
  
  function OnChangeLanguage(value) {
    if ($('#sel-editor-type').value == 'code') {
      setEditorMode(value);
    }
  }
  
  function OnSearchItemclick(targetEl) {
    let itemEl = targetEl.closest('[data-is="item"]');
    if (itemEl && targetEl.matches('[data-callback]')) {
      let form = $('form[data-name="code"]');
      let id = itemEl.dataset.id;
      
      switch (targetEl.dataset.callback) {
        case 'preview-code': previewCode(id); break;
        case 'edit-code': editCode(form, id); break;
        case 'delete-code': deleteCode(id); break;
      }
    }
  }
  
  
  
  
  function CloseCodeEditMode() {
    $('#main-section').stateList.remove('--editing');
  }
  
  function ResetFormEditCode() {
    let form = $('form[data-name="snippet"]');
    form.reset();
    form.querySelectorAll('[type="hidden"]').forEach(el => el.value = '');
    window.ui.SetEditorText('');
  }
  
  function resetForm(form) {
    form.reset();
    form.querySelectorAll('[type="hidden"]').forEach(el => el.value = '');
  }
  
  function ShowModalAddSnippet() {
    let form = $('form[data-name="code"]');
    resetForm(form);
    
    // show modal
    let modal = document.querySelectorAll('#projects-modal')[0].toggle();      
    modal.classList.toggle('modal--active', modal.isShown);
    modal.addEventListener('onclose', function() {
      modal.classList.toggle('modal--active', false);
    });
    
    initLabelsChoices(form);
    
    // focus
    window.ui.SetFocusEl(modal.querySelector('input[type="text"]'));
  }
  
  function initLabelsChoices(form, arrInitialValue = []) {
     // init select labels 
    if (!$('#sel-labels select').customData) {
      let data = {
        choicesEl: new Choices($('#sel-labels select'), {allowHTML: true}),
      };
      $('#sel-labels select').customData = data;
      // set select options
      data.choicesEl.setChoices(Array.from($$('#list-labels-input input')).map(input => ({
          value: input.value,
          label: input.value,
      })));
      $('#sel-labels select').addEventListener('change', evt => {
        let selectedValues = Array.from(evt.target.selectedOptions, option => option.value);
        form.elements['labels'].value = selectedValues.join(',');
      });
    } else {
      // reset select options
      $('#sel-labels select').customData.choicesEl.setChoices(Array.from($$('#list-labels-input input')).map(input => ({
          value: input.value,
          label: input.value,
      })));
    }
    
    for (let value of arrInitialValue) {
      $('#sel-labels select').customData.choicesEl.setChoiceByValue(value);
    }
    
  }
  
  function initLabelsChoices_backup(form) {
    // init select labels 
    if (!$('#sel-labels select').customData) {
      let data = {
        choicesEl: new Choices($('#sel-labels select'), {allowHTML: true}),
      };
      $('#sel-labels select').customData = data;
      data.choicesEl.setChoices(Array.from($$('#list-labels-input input')).map(input => ({
          value: input.value,
          label: input.value,
      })));
      $('#sel-labels select').addEventListener('change', evt => {
        let selectedValues = Array.from(evt.target.selectedOptions, option => option.value);
        form.elements['labels'].value = selectedValues.join(',');
      });
    } else {
      $('#sel-labels select').customData.choicesEl.setChoices(Array.from($$('#list-labels-input input')).map(input => ({
          value: input.value,
          label: input.value,
      })));
    }
  }
  
  function ShowModalAddCode() {
    // reset form code
    $('#main-section').stateList.add('--editing');
    ResetFormEditCode();
    
    return;
    
    let modal = document.querySelectorAll('#modal-code')[0].toggle();      
      modal.classList.toggle('modal--active', modal.isShown);
      modal.addEventListener('onclose', function() {
        $('#main-section').stateList.remove('--editing');
        modal.classList.toggle('modal--active', false);
    });
  }
  
  function OnWorkspaceRadioInput(inputEl) {
    loadWorkspaceDataByRadioValue(inputEl.value);
  }
  
  function OnSubmitSnippetForm(evt) {
    evt.preventDefault();
    
    let form = evt.target;
    let isEdit = (form.elements['id'].value.trim().length > 0);
    
    if (isEdit) {
      updateCode(form);
    } else {
      addCode(form);
    }

    let modal = document.querySelectorAll('#projects-modal')[0];
    modal.close();
  }
  
  function GetFilteredLabels() {
    let val = Array.from($$('#list-labels-input input:checked')).map(input => input.value);
    return val;
  }
  
  function GetFilteredLabelsStr() {
    let val = GetFilteredLabels().join(',');
    return val;
  }
  
  async function AddLabel() {
    let title = await windog.prompt('Label name');
    if (!title) return;
    
    
    let id = generateId();
    await compoNotes.AddDataLabel({
      id,
      name: title,
    });
    
    appendLabelEl({
      id,
      name: title,
    });
  }
  
  
  async function addCode(form) {
    let {title, description, labels} = await getCodeFormData(form);
    
    const task = title;
    if (task === '') return;
    
    let id = generateId();
    let item = {
      id,
      title,
      description,
      labels,
    };
    await compoNotes.AddData(item);
    item.id = id;
    data.push(item);
    displayDataAppend(item);
    
    previewCode(id);
  }
  
  SELF.addSnippet = async function(form) {
    let {type, language, content} = getSnippetFormData(form);
    let data = {
      type,
      language,
      content,
      id: generateId(),
      isSearchable: false,
      keywords: '',
    };
    
    await addSnippetData(data);
    let codeId = getActiveId(); 
    ListSnippets(codeId);
  };
  
  function generateId() {
    return window.utility.GenerateUUID();
  }
  
  async function getCodeFormData(form) {
    let title = form.elements['new-task'].value;
    let description = form.elements['new-task-description'].value;
    let labels = form.elements['labels'].value;
    labels = labels.trim().split(',').map(x => x.trim()).filter(x => x.length > 0);
    labels = await compoNotes.GetLabelsIdByName(labels);
    return {
      title, 
      description,
      labels,
    };
  }
  
  async function updateCode(form) {
    let {title, description, labels} = await getCodeFormData(form);
    let codeId = getActiveId();
    await compoNotes.PartialUpdateData(codeId, {
      title,
      description,
      labels,
    });
    form.reset();
    
    let d = data.find(x => x.id == codeId);
    d.title = title;
    d.description = description;
    d.labels = labels;
    
    displayDataRefresh(d);
  }
  
  function getSnippetFormData(form) {
    let type = form.elements['type'].value;
    let language = (type == 'plaintext' ? '' : form.elements['language'].value);
    let content = getText();
    return {
      type, 
      language,
      content,
    };
  }
  
  SELF.updateSnippet = async function(form) {
    let codeId = getActiveId();
    let snippetId = getActiveSnippetId();
    let code = getCodeById(codeId);
    let snippetIndex = code.content.findIndex(x => x.id == snippetId);
    if (snippetIndex < 0) return;
    
    let {type, language, content} = getSnippetFormData(form);
    code.content[snippetIndex].content = content;
    code.content[snippetIndex].type = type;
    code.content[snippetIndex].language = (type == 'code' ? language : '');
    await compoNotes.PartialUpdateData(codeId, {
      content: code.content,
    });
    ListSnippets(codeId);
    changeAppState(STATE.editCode, false);
  };
  
  SELF.deleteSnippet = async function(id) {
    if (!window.confirm('Confirm deletion')) return;
    
    
    let codeId = getActiveId();
    let code = getCodeById(codeId);
    let snippetIndex = code.content.findIndex(x => x.id == id);
    if (snippetIndex < 0) return;
    
    code.content.splice(snippetIndex, 1);
    await compoNotes.PartialUpdateData(codeId, {
      content: code.content,
    });
    ListSnippets(codeId);
  };
  
  SELF.copySnippet = function(id) {
    let el = $(`#snippets [data-id="${id}"] [data-slot="content"]`);
    if (!el) return;
    
    copyToClipboard(el.textContent);
  };
  
  function copyToClipboard(text) {
    let node  = document.createElement('textarea');
    node.value = text;
    document.body.append(node);
    node.select();
    node.setSelectionRange(0, node.value.length);
    document.execCommand("copy");
    node.remove();
  }
  
  async function EditSnippet(form, id) {
    
    form.elements['id'].value = id;
    let codeId = getActiveId();
    let code = getCodeById(codeId);
    let snippetIndex = code.content.findIndex(x => x.id == id);
    if (snippetIndex < 0) return;
    
    changeAppState(STATE.editCode, true);
    
    let snippet = code.content[snippetIndex];
    setText(snippet.content);
    form.elements['type'].value = snippet.type;
    // todo: create data migration script instead
    if (snippet.type == 'p') {
      form.elements['type'].value = 'plaintext';
    }
    form.elements['language'].value = snippet.language;
    setEditorMode(snippet.language);
    
    $('#main-section').stateList.add('--editing');
  }
  
  async function TaskEditDescription(form, id) {
    
    form.elements['id'].value = id;
    let codeId = getActiveId();
    let code = getCodeById(codeId);
    let snippetIndex = code.content.findIndex(x => x.id == id);
    if (snippetIndex < 0) return;
    
    let input = await windog.prompt('Keywords', code.content[snippetIndex].keywords);
    
    code.content[snippetIndex].keywords = input.trim();
    await compoNotes.PartialUpdateData(codeId, {
      content: code.content,
    });
    
    {
      let codeEl = $(`#snippets .i-item[data-id="${id}"]`);
      if (codeEl) {
        codeEl.querySelector('[data-slot="keywords"]').textContent = input.trim();
      }
    }
  }

  function changeAppState(state, cond) {
    document.body.stateList.toggle(state, cond);
  }
  
  async function addSnippetData(contentData) {
    let targetId = getActiveId();
    if (!targetId) return;
    
    let code = getCodeById(targetId);
    if (!code) return;
    
    if (!code.content) {
      code.content = [];
    }
    
    code.content.push(contentData);
    await compoNotes.PartialUpdateData(targetId, {
      content: code.content,
    });
  }
  
  function getActiveId() {
    let form = $('form[data-name="code"]');
    let id = form.elements['id'].value;
    return id;
  }
  
  function getActiveSnippetId() {
    let form = $('form[data-name="snippet"]');
    let id = form.elements['id'].value;
    return id;
  }
  
  async function previewCode(id) {
    let code = getCodeById(id);
    if (!code) return;
    
    // save session
    window.appSettings.SetLastOpenedCode(id);
    saveSettings();

    SetSearchResultItemActiveState(id);
    window.stateManager.SetBreadcrumb(code.title);
    
    let labelsId = code.labels;
    let form = $('form[data-name="code"]');
    form.elements['id'].value = code.id;
    
    ListSnippets(id);
    UpdateBreadcrumb();
  }
  
  function UpdateBreadcrumb() {
    $('#txt-breadcrumb').textContent = window.stateManager.GetBreadcrumb();
  }
  
  function SetSearchResultItemActiveState(id) {
    let activeEl = $(`#recent [data-kind="item"][data-state~="--active"]`);
    if (activeEl) {
      activeEl.stateList.remove('--active');
    }
    
    let itemEl = $(`#recent [data-kind="item"][data-id="${id}"]`);
    if (itemEl) {
      itemEl.stateList.add('--active');
    }
  }
  
  async function editCode(form, id) {
    let code = getCodeById(id);
    if (!code) return;
    
    resetForm(form);
    window.ui.ChangeAppState(STATE.editSnippet, true);
    
    let labelsId = code.labels;
    let labelsArr = await compoNotes.GetLabelsNameById(labelsId);
    form.elements['id'].value = code.id;
    form.elements['new-task'].value = code.title;
    form.elements['new-task-description'].value = code.description;
    form.elements['labels'].value = labelsArr.join(', ');
    
    // open modal
    let modal = document.querySelectorAll('#projects-modal')[0].toggle();      
    modal.classList.toggle('modal--active', modal.isShown);
    modal.addEventListener('onclose', function() {
      modal.classList.toggle('modal--active', false);
      window.ui.ChangeAppState(STATE.editSnippet, false);
    });
    
    initLabelsChoices(form, labelsArr);
    
    // focus
    SetFocusEl(modal.querySelector('input[type="text"]'));
  }
  
  function ShowModalForm(modalSelector, formData, formStateClass, formCallback) {
    
    return new Promise(resolve => {
    
      let modal = $(modalSelector).toggle();      
      
      let form = modal.querySelector('form');
      if (!form.stateList.contains('--listener-attached')) {
        form.addEventListener('submit', (evt) => {
          event.preventDefault();
          formCallback(form, modal)
        });
        form.stateList.add('--listener-attached')
      }
      
      modal.classList.toggle('modal--active', modal.isShown);
      modal.addEventListener('onclose', function() {
        modal.classList.toggle('modal--active', false);
        window.ui.ChangeAppState(STATE.editSnippet, false);
        resolve();
      });
    
    });
    
  }
  
  function SetFocusEl(el) {
    let interval = window.setInterval(function() {
      if (document.activeElement == el) {
        clearInterval(interval);
      } else {
        document.activeElement.blur();
        el.focus();
      }
    }, (4));
  }
  
  function deleteCode(id) {
    if (!window.confirm('Confirm deletion')) return;
    
    compoNotes.DeleteData(id);
    let deleteIndex = data.findIndex(x => x.id == id);
    data.splice(deleteIndex, 1);
    displayDataRemove(id);
  }
  
  
  SELF.displayData = function(inputData) {
    
    let sourceData = data;
    if (typeof(inputData) != 'undefined') {
      if (inputData === null) {
        $('#recent').innerHTML = '';
        return;
      }
      sourceData = inputData;
    }
    
  	let docFrag = document.createDocumentFragment();
    $('#recent').innerHTML = '';
    for (let inputData of sourceData) {
    	let el = window.templateSlot.fill({
    	  data: inputData, 
    	  template: document.querySelector('#tmp-result').content.cloneNode(true), 
    	  modifier: (el, data) => {
    	    el.querySelector('[data-is="item"]').dataset.id = data.id; 
	      },
    	});
    	docFrag.append(el);
    }
    $('#recent').append(docFrag);
  };
  
  function displayDataAppend(data) {
    $('#recent').innerHTML = '';
  	let docFrag = document.createDocumentFragment();
  	let el = window.templateSlot.fill({
  	  data, 
  	  template: document.querySelector('#tmp-result').content.cloneNode(true), 
  	  modifier: (el, data) => {
  	    el.querySelector('[data-is="item"]').dataset.id = data.id; 
      },
  	});
  	docFrag.append(el);
    $('#recent').append(docFrag);
  }
  
  function displayDataRemove(id) {
    let itemEl = $(`#recent .i-item[data-id="${id}"]`);
    if (itemEl) {
      itemEl.remove();
    }
  }
  
  function displayDataRefresh(item) {
    let itemEl = $(`#recent .i-item[data-id="${item.id}"]`);
    if (itemEl) {
      itemEl.querySelector('[data-slot="title"]').textContent = item.title;
      itemEl.querySelector('[data-slot="description"]').innerHTML = item.description;
    }
  }
  
  function getCodeById(id) {
    return data.find(x => x.id == id);
  }
  
  function ListSnippets(id) {
    
    $('#snippets').innerHTML = '';
    let contentData = getCodeById(id).content;
    if (!contentData) 
      return;
    
    let docFrag = document.createDocumentFragment();
    for (let data of contentData) {
      let templateNode;
      if (data.type == 'code') {
        templateNode = document.querySelector('#tmp-content-code');
      } else {
        templateNode = document.querySelector('#tmp-content-plaintext');
      }
    	let el = window.templateSlot.fill({
    	  data: data, 
    	  template: templateNode.content.cloneNode(true), 
    	  modifier: (el, data) => {
    	    let itemEl = el.querySelector('[data-is="item"]');
    	    if (!itemEl) return;
    	    
    	    itemEl.dataset.id = data.id; 
	      },
    	});
    	docFrag.append(el);
    }

    $('#snippets').append(docFrag);
    highlightCode();
  }
  
  function highlightCode() {
    hljs.highlightAll();
  }

  async function listLabels() {
    $('#list-labels-input').innerHTML = '';
    
    let labels = (await compoNotes.GetAllDataLabels());
    let docFrag = document.createDocumentFragment();
    for (let data of labels) {
      let el = window.templateSlot.fill({
        data, 
        template: document.querySelector('#tmp-labels').content.cloneNode(true), 
        modifier: (el, data) => {
          el.querySelector('input').value = data.name;
          el.querySelector('span').textContent = data.name;
        },
      });
      docFrag.append(el);
    }
    $('#list-labels-input').append(docFrag);
  }
  
  function appendLabelEl(data) {
    let docFrag = document.createDocumentFragment();
    let el = window.templateSlot.fill({
      data, 
      template: document.querySelector('#tmp-labels').content.cloneNode(true), 
      modifier: (el, data) => {
        el.querySelector('input').value = data.name;
        el.querySelector('span').textContent = data.name;
      },
    });
    docFrag.append(el);
    $('#list-labels-input').append(docFrag);
  }
  
  
  
  

  async function Init() {
    attachListeners();  
    initEditor();
    
    initUserPreferences();
    await listLabels();
  }
  
  
  function AppendSearchResultPartial(inputData) {
    let docFrag = document.createDocumentFragment();
    $('#recent').innerHTML = '';
  	let el = window.templateSlot.fill({
  	  data: inputData, 
  	  template: document.querySelector('#tmp-result').content.cloneNode(true), 
  	  modifier: (el, data) => {
  	    el.querySelector('[data-is="item"]').dataset.id = data.id; 
      },
  	});
  	docFrag.append(el);
    $('#recent').append(docFrag);
  }
  
  
  
  
  
  function initUserPreferences() {
    if (appSettings.data.codePreview.wordWrap) {
      window.ui.ChangeAppState(STATE.codePreviewWrap, true);
    }
  }
  
  let editor;
  // Utility function to get the text from the editor
  function getText() {
    return editor.getValue();
  }

  // Utility function to set the text in the editor
  function setText(text) {
    editor.setValue(text);
  }
  
  function SetEditorText(text) {
    editor.setValue(text);
  }
  
  function setEditorMode(lang) {
    let mode = 'text';
    switch (lang) {
      case 'java': mode = 'java'; break;
      case 'js': mode = 'javascript'; break;
      case 'go': mode = 'golang'; break;
      case 'css': mode = 'css'; break;
      case 'html': mode = 'html'; break;
      case 'markdown': mode = 'markdown'; break;
      case 'typescript': mode = 'typescript'; break;
      case 'dart': mode = 'dart'; break;
      case 'json': mode = 'json'; break;
      case 'csharp': mode = 'csharp'; break;
      case 'sql': mode = 'sql'; break;
    }
    editor.session.setMode(`ace/mode/${mode}`);
  }
  
  function initEditor() {
    let el = $('form[data-name="snippet"] [name="content"]');
    editor = ace.edit(el);
    initDefaultEditorOptions(editor);
  }
  
  function initDefaultEditorOptions(editor) {
    editor.setTheme("ace/theme/monokai");
    editor.setOption("scrollPastEnd", 1);
    // editor.setOptions({
      // showGutter: false,
      // fontSize: 14,
    // });
    
    editor.commands.addCommand({
      name: "movelinesup",
      bindKey: {win:"Ctrl-Shift-Up"},
      exec: function(editor) {
        editor.moveLinesUp();
      }
    });
    editor.commands.addCommand({
      name: "save",
      bindKey: {win:"Ctrl-S"},
      exec: function(editor) {
        let form = $('[data-name="snippet"]');
        let isEditing = document.body.stateList.contains('--code-edit'); // todo: make and check form state instead
	      if (isEditing) {
          window.ui.updateSnippet(form);
	      } else {
	        window.ui.addSnippet(form);
	      }
	      window.ui.CloseCodeEditMode();
        // document.querySelectorAll('#modal-code')[0].close();    
      }
    });
    editor.commands.addCommand({
      name: "movelinesdown",
      bindKey: {win:"Ctrl-Shift-Down"},
      exec: function(editor) {
        editor.moveLinesDown();
      }
    });
    editor.commands.addCommand({
      name: "select-or-more-after",
      bindKey: {win:"Ctrl-D"},
      exec: function(editor) {
        if (editor.selection.isEmpty()) {
          editor.selection.selectWord();
        } else {
          editor.execCommand("selectMoreAfter");
        }
      }
    });
    editor.commands.addCommand({
      name: "removeline",
      bindKey: {win: "Ctrl-Shift-K"},
      exec: function(editor) {
        editor.removeLines();
      }
    });
    
    editor.commands.addCommand({
      name: "custom-copy",
      bindKey: {win: "Ctrl-C"},
      exec: function(editor) {
        let selection = editor.getSelectionRange();
        if (selection.start.row == selection.end.row && selection.start.column == selection.end.column) {
          let row = selection.start.row;
          let col = selection.start.column;
          editor.selection.setSelectionRange({start:{row,column:0},end:{row:row+1,column:0}});
          if (window.pipWindowDoc) {
            window.pipWindowDoc.execCommand('copy');
          } else {
            document.execCommand('copy');
          }
          editor.clearSelection();
          editor.moveCursorTo(row, col);
        } else {
          if (window.pipWindowDoc) {
            window.pipWindowDoc.execCommand('copy');
          } else {
            document.execCommand('copy');
          }
        }
      }
    });
    
    editor.commands.addCommand({
      name: "custom-cut",
      bindKey: {win: "Ctrl-X"},
      exec: function(editor) {
        let selection = editor.getSelectionRange();
        if (selection.start.row == selection.end.row && selection.start.column == selection.end.column) {
          let row = selection.start.row;
          editor.selection.setSelectionRange({start:{row,column:0},end:{row:row+1,column:0}});
          if (window.pipWindowDoc) {
            window.pipWindowDoc.execCommand('cut');
          } else {
            document.execCommand('cut');
          }
        } else {
          if (window.pipWindowDoc) {
            window.pipWindowDoc.execCommand('cut');
          } else {
            document.execCommand('cut');
          }
        }
      }
    });
  }
  
  function SaveCheckedLabels() {
    let labels = GetFilteredLabelsStr();
    window.appSettings.UpdateWorkspace(window.appSettings.data.activeWorkspace, labels);
    saveSettings();
    // window.localStorage.setItem('coper-NzYxNjc1Ng', workspace);
  }
  
  function attachListeners() {
    DOMEvents.Init();
    blurOnEscape();
    focusOnSlashKey();
    attachKeyboardShortcuts();
    
    // code snippet page specific
    attachKeywordsListeners();
  }
  
  function attachKeywordsListeners() {
    const listenAndToggleVisibility = (element, selector, visibleClass, containerSelector) => {
      
      element.addEventListener('input', async () => {
        
        const inputValue = element.value.toLowerCase();
        let els = document.querySelectorAll(containerSelector)
        let data = [];
        for (let el of els) {
          if (el.querySelector('[data-slot="keywords"]').textContent.trim().length == 0) continue;
          
          data.push({
            el,
            queryEl: el.querySelector('[data-slot="keywords"]'),
            description: el.querySelector('[data-slot="keywords"]').textContent,
          })
        }

        let res = await search(inputValue, data);
        for (let node of els) {
          node.classList.add(visibleClass);
        }
        if (res) {
          for (let d of res) {
            d.el.classList.remove(visibleClass);
            d.queryEl.innerHTML = d.description;
            $('#snippets').append(d.el);
          }
        } else {
          for (let node of els) {
            node.querySelector('[data-slot="keywords"]').textContent = node.querySelector('[data-slot="keywords"]').textContent;
            node.classList.remove(visibleClass);
          }
        }
        
      });
      
      // Fuse.js options
      const options = {
        keys: ['description'], // Fields to search
        includeMatches: true, // Include matched indices and value
        threshold: 0.7 // Minimum score for a match (0.0 to 1.0)
      };
      
      async function search(keyword, data) {
        
        if (keyword.trim().length == 0) {
          return null;
        }
        
        let gogo = [];
        
        
        const fuse = new Fuse(data, options);
        const results = fuse.search(keyword);
      
        for (let i = 0; i < results.length; i++) {
          const { item, matches } = results[i];
          let modifData = {
            // id: item.id,
            // title: item.title,
            description: item.description,
            el: item.el,
            queryEl: item.queryEl,
            // labelsName: (await compoNotes.GetLabelsNameById(item.labels)),
          };
          gogo.push(modifData);
      
          for (let j = 0; j < matches.length; j++) {
            const { key, indices } = matches[j];
      
            for (let k = 0; k < indices.length; k++) {
              const [start, end] = indices[k];
              const markedText = item[key].substring(start, end + 1);
              const markedValue = `<mark>${markedText}</mark>`;
              modifData[key] = item[key].substring(0, start) + markedValue + item[key].substring(end + 1);
            }
          }
        }
        
        return gogo;
      }
      
    };
    listenAndToggleVisibility($('.in-search-keywords'), '[data-slot="keywords"]', 'd-none', '#snippets .i-item');
  }
  
  function applyWorkspaceCheckedLabels() {
    let form = $('form[name="workspace"]');
    let radioName = 'workspace';
    let val = form[radioName].value;
    
    let pickedLabels = '';
    let workspace = app.GetWorkspaceById(val);
    if (workspace) {
      pickedLabels = workspace.labels;
    }
    setCheckedLabels(pickedLabels.split(','));
    displayListTags(pickedLabels);
  }
  
  function loadWorkspaceDataByRadioValue(value) {
    window.appSettings.SetActiveWorkspace(value);
    saveSettings();
    applyWorkspaceCheckedLabels();
    reloadData();
  }
  
  
  
  
  function attachKeyboardShortcuts() {
    let form = $('form[name="workspace"]');
    let radioName = 'workspace';
    
    Mousetrap.bind('alt+n', function(e) {
      $('[data-callback="show-add-modal"]').click();
      return false;
    });
    Mousetrap.bind('ctrl+]', function(e) {
      let val = toggleRadio(form, radioName, true);
      loadWorkspaceDataByRadioValue(val);
      return false;
    });
    Mousetrap.bind('ctrl+[', function(e) {
      let val = toggleRadio(form, radioName, false);
      loadWorkspaceDataByRadioValue(val);
      return false;
    });

    
    // command palette
    Mousetrap.bind('ctrl+shift+p', (evt) => {
      evt.preventDefault();
      openPalette();
    });
    
    
    
  }
  
  function openPalette() {
    ToggleInsertSnippet()
  }
  
  function ToggleInsertSnippet(persistent) {
    let el = $('.search-box');
    el.classList.remove('d-none')
    $('#search-input').addEventListener('blur', hidePalette);
    if (!el.classList.contains('d-none')) {
      $('#search-input').value = '';
      setTimeout(() => { $('#search-input').focus(); }, 1);
    } else {
      setTimeout(() => { document.activeElement.blur() }, 1);
      // if (typeof(persistent) === 'undefined')
        // fileTab[activeTab].editor.env.editor.focus();
      $('#search-input').value = '';
      $('#search-input').blur();
    }
  }
  
  async function hidePalette(event) {
    await delayMs(10);
    let el = $('.search-box');
    el.classList.toggle('d-none', true);
    $('#search-input').value = '';
    $('#search-input').removeEventListener('blur', hidePalette);
  }
  
  function delayMs(timeout) {
    return new Promise(resolve => window.setTimeout(resolve, timeout));
  }
  
  
  function saveSettings() {
    window.appSettings.save();
  }
  
  function toggleRadio(form, radioName, next) {
    const radios = form.elements[radioName];
    const current = Array.from(radios).findIndex((r) => r.checked);
    const target = next ? (current + 1) % radios.length : (current - 1 + radios.length) % radios.length;
    radios[target].checked = true;
    return radios[target].value;
  }
  
  function blurOnEscape() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        document.activeElement.blur();
      }
    });
  }
  
  function focusOnSlashKey() {
    
    let callbackFired = false;
  
    function detectSlash(e) {
      if (e.key === '/' && !callbackFired) {
        callbackFired = true;
        const focusedElement = e.target;
        if (focusedElement === document.body) {
          e.preventDefault();
          $('.focusable-on-slash-key').focus();
        }
      }
    }
    
    function resetCallback() {
      callbackFired = false;
    }
  
    window.addEventListener('blur', resetCallback);
    document.addEventListener('keyup', resetCallback);
    document.addEventListener('keydown', detectSlash);
  }
  
  
  return SELF;
  
})();