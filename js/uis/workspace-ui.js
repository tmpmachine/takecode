let uiWorkspace = (function() {

    let $ = document.querySelector.bind(document);

    let SELF = {
        AttachListeners,
        SetCheckedLabels: setCheckedLabels,
        ListWorkspaces,
        HandleClickListWorkspace,
        AddWorkspace,
        DisplayListTags: displayListTags,
        CloseActiveWorkspaceTab,
        ListWorkspacesTab,
        OnClickWorkspaceTab,
        HandleMouseEvt,
        RestoreSession,
    };

    let actionEvents = {
        workspaceItem: {
            'edit': (data) => Edit(data),
            'delete': (data) => confirmWorkspaceDelete(data),
        }
    };

    function HandleMouseEvt(evt) {
        if (evt.button !== 1) return;

        let targetEl = evt.target;
        let tabEl = targetEl.closest('[data-kind="item"]');
        let itemId = tabEl?.dataset?.id;
        closeWorkspaceTabById(itemId);
    }

    let reloadData = debounce(300, () => {
        SaveCheckedLabels();
        reInitData();
    });


    function AttachListeners() {
        Mousetrap.bind('alt+w', () => CloseActiveWorkspaceTab());
        Mousetrap.bind('alt+,', () => {
        goToPrevWorkspaceTab();
        focusOnSearchEl();
        });
        Mousetrap.bind('alt+.', () => {
        goToNextWorkspaceTab();
        focusOnSearchEl();
        });
    }

    function focusOnSearchEl() {
        $('.focusable-on-slash-key').focus();
    }

    async function AddWorkspace() {
        let title = await windog.prompt('Workspace name');
        if (!title) return;
        
        let labels = ui.GetFilteredLabelsStr();
        let data = window.appSettings.AddWorkspace(title, labels);
        saveSettings();
        
        appendWorkspaceEl(data);
        
        windog.alert('A page reload is required to take effect.')
        
    }

    function saveSettings() {
        window.appSettings.save();
    }

    function appendWorkspaceEl(item) {
        let docFrag = document.createDocumentFragment();
        let labelUID = performance.now();
        let el = window.templateSlot.fill({
        data: item, 
        template: document.querySelector('#tmp-list-workspace-item').content.cloneNode(true), 
        modifier: (el, data) => {
            // let inputEl = el.querySelector('input');
            // let labelEl = el.querySelector('label');
            // inputEl.value = data.id;
            // inputEl.setAttribute('id', `#${labelUID}`);
            // labelEl.setAttribute('for', `#${labelUID}`);
        },
        });
        
        
        let itemEl = el.querySelector('[data-kind="item"]');
        itemEl.dataset.id = item.id;
        
        docFrag.append(el);
        $('#container-list-workspaces').append(docFrag);
    }

    function getWorkspaceById(id) {
        return window.appSettings.data.workspaces.find(x => x.id == id);
    }

    function confirmWorkspaceDelete(data) {
        let workspace = getWorkspaceById(data.id);
        if (!workspace) return;
        if (!window.confirm(`Delete workspace ${workspace.name}?`)) return;
        
        window.appSettings.DeleteWorkspace(workspace.name);
        compoWorkspace.Commit();
        appSettings.save();
        
        
        deleteWorkspaceEl(data.id);
        
        windog.alert('A page reload is required to take effect.')

        // closeActiveWorkspaceTab();
        
    }


    function deleteWorkspaceEl(id) {
        let el = $('#container-list-workspaces').querySelector(`[data-id="${id}"]`);
        if (!el) return;
        
        el.remove();
    }


    async function Edit(data) {
        let workspace = getWorkspaceById(data.id);
        if (!workspace) return;
        
        let userVal = await windog.prompt('Workspace name', workspace.name);
        if (userVal === null) return;

        compoWorkspace.UpdateItemById(workspace.id, {
            name: userVal,
        });


        compoWorkspace.Commit();
        appSettings.save();
        
        ListWorkspaces();
        ListWorkspacesTab();
    }

    function formCallback(form, modal) {
        console.log(form, modal)
    }

    function HandleClickListWorkspace(evt) {
        let targetEl = evt.target;
        if (!targetEl.closest('[data-kind="item"]')) return;
        if (!targetEl.closest('[data-action]')) return;
        
        let itemEl = targetEl.closest('[data-kind="item"]');
        let id = itemEl.dataset.id;
        
        // todo
        execCallbackOnAction(targetEl.dataset.action, actionEvents.workspaceItem, {
        id,
        })
        
    }

    function execCallbackOnAction(callbackKey, callbacks, data) {
        let callbackFunc = callbacks[callbackKey];
        callbackFunc(data);
    }

    function ListWorkspaces() {
        $('#container-list-workspaces').innerHTML = '';
        
        let items = [...compoWorkspace.GetAll()];
        
        // init command palette
        try {
            initCommandPalette(items);
        } catch(e) {
            console.error(e);
        }
        
        let docFrag = document.createDocumentFragment();
        for (let item of items) {
            let el = window.templateSlot.fill({
                data: item, 
                template: document.querySelector('#tmp-list-workspace-item').content.cloneNode(true), 
            });
        
            let itemEl = el.querySelector('[data-kind="item"]');
            itemEl.dataset.id = item.id;
            
            docFrag.append(el);
        }
        $('#container-list-workspaces').append(docFrag);
    }

    function initCommandPalette(snippets) {
        
        snippets = snippets.map(x => {
        return Object.assign({
            title: x.name,
        }, x);
        })
        
        ;(function() {
        
        let customSnippetsCounter = 0;
        let index = 0;
        for (let snippet of snippets) {
            snippet.index = index;
            if (snippet.snippet)
                snippet.snippet = snippet.snippet.replace(/\t/g, '  ');
            index++;
        }
        
        // https://github.com/bevacqua/fuzzysearch
        function fuzzysearch (needle, haystack) {
            var tlen = haystack.length;
            var qlen = needle.length;
            var matchIndexes = [];
            if (qlen > tlen) {
            return {isMatch: false};
            }
            if (qlen === tlen) {
            return {isMatch: true, matchIndexes};
            }
            var i = 0;
            var j = 0;
            outer: for (; i < qlen; i++) {
            var nch = needle.charCodeAt(i);
            while (j < tlen) {
                if (haystack.charCodeAt(j++) === nch) {
                matchIndexes.push(j-1);
                continue outer;
                }
            }
            return {isMatch: false};
            }
            return {isMatch: true, matchIndexes};
        }
        
        $('#search-input').addEventListener('keydown', () => {
            wgSearch.selectHints()
        });
        
        $('#search-input').addEventListener('input', (evt) => {
            wgSearch.find(evt.target.value)
        });
        
        var wgSearchRes;
        var wgSearch = {
            hints: [],
            pageId: '',
            callback: (data) => {
            openWorkspaceByCommand(data);
            },
            keywords: [],
            match: function(value) {
            this.find.idx = -1;
        
            if (value.trim().length < 2) return [];
            var data = [];
            var extraMatch = [];
            for (var i=0,title,matchIdx,match=1,xmatch=1,wildChar,offset,creps; i<snippets.length; i++) {
                if (match > 10) break;
                titleOri = snippets[i].title;
                let search = fuzzysearch(value,titleOri.toLowerCase());
                if (search.isMatch) {
                if (search.matchIndexes.length === 0) {
                    if (value == titleOri.toLowerCase()) {
                    data.push({index:snippets[i].index,title:'<b>'+titleOri+'</b>'});
                    match++;
                    } else {
                    extraMatch.push({index:snippets[i].index,title:titleOri});
                    xmatch++;
        
                    }
                } else {
                    titleOri = titleOri.split('');
                    for (let index of search.matchIndexes) {
                    titleOri[index] = '<b>'+titleOri[index]+'</b>';
                    }
                    data.push({index:snippets[i].index,title:titleOri.join('')});
                    match++;
                }
                }
            }
            if (match < 10) {
                for (var i=0; i<xmatch-1 && match<10; i++) {
                data.push(extraMatch[i]);
                match++;
                }
            }
            return data;
            },
            selectHints: function() {
            let hints = $$('.search-hints');
            if (hints.length === 0)
                return;
        
            switch(event.keyCode) {
                case 13:
                if (this.find.idx > -1) {
                    event.preventDefault();
                    hints[this.find.idx].click();
                }
                break;
                case 38:
                event.preventDefault();
                this.find.idx--;
                if (this.find.idx == -2) {
                    this.find.idx = hints.length-1;
                    hints[this.find.idx].classList.toggle('selected');
                } else {
                    hints[this.find.idx+1].classList.toggle('selected');
                    if (this.find.idx > -1 && this.find.idx < hints.length)
                    hints[this.find.idx].classList.toggle('selected');
                }
                return;
                break;
                case 40:
                this.find.idx++;
                if (this.find.idx == hints.length) {
                    this.find.idx = -1;
                    hints[hints.length-1].classList.toggle('selected');
                } else {
                    hints[this.find.idx].classList.toggle('selected');
                    if (this.find.idx > 0 && this.find.idx < hints.length)
                    hints[this.find.idx-1].classList.toggle('selected');
                }
                return;
                break;
            }
            },
            highlightHints: function() {
            let idx = Number(this.dataset.searchIndex);
            var hints = $('.search-hints');
            for (var i=0; i<hints.length; i++) {
                if (i == idx)
                hints[i].classList.toggle('selected',true);
                else
                hints[i].classList.toggle('selected',false);
            }
            wgSearch.find.idx = idx;
            },
            displayResult: function(data) {
            $('#search-result').innerHTML = '';
            let i = 0;
            for (let hint of data) {
                if (index == data.length-1) {
                let tmp = $('#tmp-hints-last').content.cloneNode(true);
                tmp.querySelectorAll('.Title')[0].innerHTML = hint.title;
                // tmp.querySelectorAll('.Container')[0].addEventListener('mouseover', wgSearch.highlightHints);
                tmp.querySelectorAll('.Container')[0].addEventListener('click', insertTemplate);
                tmp.querySelectorAll('.Container')[0].dataset.index = hint.index;
                tmp.querySelectorAll('.Container')[0].dataset.searchIndex = i;
                $('#search-result').appendChild(tmp);
                } else {
                let tmp = $('#tmp-hints').content.cloneNode(true);
                tmp.querySelectorAll('.Title')[0].innerHTML = hint.title;
                // tmp.querySelectorAll('.Container')[0].addEventListener('mouseover', wgSearch.highlightHints);
                tmp.querySelectorAll('.Container')[0].addEventListener('click', insertTemplate);
                tmp.querySelectorAll('.Container')[0].dataset.index = hint.index;
                tmp.querySelectorAll('.Container')[0].dataset.searchIndex = i;
                $('#search-result').appendChild(tmp);
                }
                i++;
            }
            },
            find: function(v) {
            clearTimeout(this.wait);
            this.v = v;
            
            if (this.v.trim().length < 2) {
                $('#search-result').innerHTML = '';
                return;
            }
            
            var data = wgSearch.match(this.v.toLowerCase());
            
            if (this.keywords.indexOf(v) < 0) {
                this.displayResult(data);
                this.keywords.push(v);
            }
            else if (data.length >= 0)
                this.displayResult(data);
            
            }
        };
        
        window.insertTemplate = function() {
            let index = this.dataset.index;
            let data = snippets[index];
            $('#search-result').innerHTML = '';
            ui.ToggleInsertSnippet();
            if (wgSearch.callback) {
            wgSearch.callback(data);
            } else {
            console.log(data.snippet)
            }
        }
        
        })();
        
    }

    function ListWorkspacesTab() {
        $('#list-workspace-tab').replaceChildren();

        let docFrag = document.createDocumentFragment();
        let labelUID = performance.now();
        let index = 0;

        for (let workspaceId of appSettings.data.workspacesTab) {
            let workspace = getWorkspaceById(workspaceId);
            if (!workspace) continue;
            
            let el = window.templateSlot.fill({
                data: {
                name: workspace.name,
                }, 
                template: document.querySelector('#tmp-workspace-tab').content.cloneNode(true), 
            });
            
            let itemEl = $kind('item', el);
            itemEl.dataset.id = workspaceId;
            
            if (appSettings.data.activeWorkspace == workspaceId) {
                itemEl.stateList.add('--active');
            }
                
            index++;
            docFrag.append(el);
        }
        $('#list-workspace-tab').append(docFrag);
    }

    function openWorkspaceByCommand(item) {
        let activeWorkspaceName = item.id;
        if (appSettings.data.workspacesTab.includes(activeWorkspaceName)) {
            GoToWorkspaceTabByName(item.id);
        } else {
            appSettings.data.workspacesTab.push(activeWorkspaceName);
            window.appSettings.SetActiveWorkspace(activeWorkspaceName);
            saveSettings();
            ListWorkspacesTab();
            GoToWorkspaceTabByName(item.id);
        }
        window.setTimeout(() => {
        $('#search').focus();
        }, 1);
    }

    function GoToWorkspaceTabByName(dataName) {
        let els = $$('#list-workspace-tab [data-kind="item"]');
        els.forEach(el => {
            el.stateList.remove('--active');
        });
        
        $(`#list-workspace-tab [data-id="${dataName}"]`).stateList.add('--active');
        
        // set active tab    
        let workspaceId = dataName;
        window.appSettings.SetActiveWorkspace(workspaceId);
        saveSettings();
        
        // reload data
        applyWorkspaceTabLabels();
        reloadDataByTab().then(() => {
        RestoreSession(workspaceId);
        });
    }

    function setCheckedLabels(labelsArr) {
        for (let el of $$('#list-labels-input input')) {
            el.checked = labelsArr.includes(el.value);
        }
    }

    function applyWorkspaceTabLabels() {
        let val = appSettings.data.activeWorkspace;
        
        let pickedLabels = '';
        let workspace = getWorkspaceById(val);
        if (workspace) {
            pickedLabels = workspace.labels;
        }
        setCheckedLabels(pickedLabels.split(','));
        displayListTags(pickedLabels);
    }

    let reloadDataByTab = debounce(500, () => {
        // SaveCheckedLabels();
        return new Promise(resolve => {
        reInitData().then(() => resolve());
        });
    });


    function debounce(time, callback) {
        let timeoutId;
        return function(...args) {
        
            return new Promise(resolve => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                let result = callback(...args);
                if (result instanceof Promise) {
                    result.then(() => resolve());
                }
                }, time);
            });
            
        };
    }

    function displayListTags(labels) {
        $('#list-item-tags').textContent = labels.split(',').join(', ');
    }

    function OnClickWorkspaceTab(targetEl) {
        let tabEl = targetEl.closest('[data-kind="item"]');
        if (targetEl.matches('[data-kind="btn-delete"]')) {
            closeWorkspaceTabById(tabEl.dataset.id);
        } else if (tabEl) {
            GoToWorkspaceTabByName(tabEl.dataset.id);
        }
    }

    function closeWorkspaceTabById(id) {
        let delIndex = appSettings.data.workspacesTab.findIndex(item => item == id);
        appSettings.data.workspacesTab.splice(delIndex, 1);
        
        let activeWorkspaceTab = appSettings.data.activeWorkspace;
        
        if (appSettings.data.workspacesTab.length == 0) {
            window.appSettings.SetActiveWorkspace('');
        } else if (activeWorkspaceTab == id) {
            let activeIndex = Math.max(0, delIndex-1);
            GoToWorkspaceTabByName(appSettings.data.workspacesTab[activeIndex]);
        }
        
        saveSettings(); 
        ListWorkspacesTab();
        
    }

    function openWorkspaceAsTab() {
        let activeWorkspaceName = appSettings.data.activeWorkspace;
        if (appSettings.data.workspacesTab.includes(activeWorkspaceName) ||
            activeWorkspaceName == '') {
        return;
        }
        
        
        appSettings.data.workspacesTab.push(activeWorkspaceName);
        window.appSettings.SetActiveWorkspace(activeWorkspaceName);
        saveSettings();
        
        ListWorkspacesTab();
    }

    function goToPrevWorkspaceTab() {
        let y = $$('#list-workspace-tab [data-kind="item"]');
        let els = Array.from(y);
        
        if (els.length < 2) return;

        let x = $('#list-workspace-tab [data-state~="--active"]');
        if (!x) {
        x = $$('#list-workspace-tab [data-kind="item"]')[0];
        }
        
        let activeIndex = els.findIndex(item => item == x);
        let len = els.length;
        if (activeIndex == 0) {
        activeIndex = len;
        }
        activeIndex--;
        
        x.stateList.remove('--active');
        els[activeIndex].stateList.add('--active');
        
        // set active tab    
        let workspaceId = els[activeIndex].dataset.id;
        window.appSettings.SetActiveWorkspace(workspaceId);
        saveSettings();
        
        // reload data
        applyWorkspaceTabLabels();
        reloadDataByTab().then(() => {
        RestoreSession(workspaceId);
        });
    }

    function RestoreSession(workspaceId) {
        let existingDataIndex = window.appSettings.data.session.workspaceLastOpenedCode.findIndex(x => x.workspaceId == workspaceId);
        if (existingDataIndex < 0) return;
        
        let codeId = window.appSettings.data.session.workspaceLastOpenedCode[existingDataIndex].codeId;
        
        let code = ui.getCodeById(codeId);
        if (!code) return;
        
        ui.SetSearchResultItemActiveState(codeId);
        window.stateManager.SetBreadcrumb(code.title);
        
        let labelsId = code.labels;
        let form = $('form[data-name="code"]');
        form.elements['id'].value = code.id;
        
        ui.ListSnippets(codeId);
        ui.UpdateBreadcrumb();
        
        ui.AppendSearchResultPartial(code);
    }


    function goToNextWorkspaceTab() {
        let y = $$('#list-workspace-tab [data-kind="item"]');
        let els = Array.from(y);
        
        if (els.length < 2) return;
        
        let x = $('#list-workspace-tab [data-state~="--active"]');
        if (!x) {
        x = $$('#list-workspace-tab [data-kind="item"]')[0];
        }
        let activeIndex = els.findIndex(item => item == x);
        let len = els.length;
        activeIndex = (activeIndex + 1) % len;
        
        x.stateList.remove('--active');
        els[activeIndex].stateList.add('--active');
        
        // set active tab    
        let workspaceId = els[activeIndex].dataset.id;
        window.appSettings.SetActiveWorkspace(workspaceId);
        saveSettings();
        
        // reload data
        applyWorkspaceTabLabels();
        reloadDataByTab().then(() => {
        RestoreSession(workspaceId);
        });
    }



    function CloseActiveWorkspaceTab() {
        let activeWorkspaceTab = appSettings.data.activeWorkspace;
        let delIndex = appSettings.data.workspacesTab.findIndex(x => x == activeWorkspaceTab);
        if (activeWorkspaceTab == '' && appSettings.data.workspacesTab.length > 0) {
        delIndex = 0;
        }
        if (delIndex < 0) return;
        
        appSettings.data.workspacesTab.splice(delIndex, 1);
        if (appSettings.data.workspacesTab.length > 0) {
        let activeIndex = Math.max(0, delIndex-1);
        window.appSettings.SetActiveWorkspace(appSettings.data.workspacesTab[activeIndex]);
        } else {
        window.appSettings.SetActiveWorkspace('');
        }
        saveSettings(); 
        
        ListWorkspacesTab();
    }




    return SELF;

})();