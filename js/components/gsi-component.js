let compoGsi = (function() {
  
  let SELF = {
    InitTokenClient,
    RequestToken,
    RevokeToken,
    TaskAuthorize,
    InitData,
    ClearToken,
    RestoreDataFromTemp,
    BackupDataToTemp,
    Commit,
    Logout,
  };
  
  let data = {
    userEmail: '',
    access_token: '',
    expires_at: 0,
  };
  
  let local = {
    client_id: '254780146992-ei6h2q5o17uiaiq5cegsjer1873pitdq.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email',
    tokenClient: null,
    isOnGoingAuthProcessStarted: false, 
    tempData: null,
  };
  
  function Logout() {
    let isConfirm = window.confirm('This will only sign out your account. See Application Data section to clear application data. Continue?');
    if (!isConfirm) return;
    
    data.userEmail = '';
    ClearToken();
    Commit();
    
    reloadAuthState();
  }
  
  function reloadAuthState() {
    if (data.access_token?.trim().length > 0) {
      viewStateUtil.Add('authorized-features', ['authorized']);
      return;
    }
    viewStateUtil.Remove('authorized-features', ['authorized']);
  }
  
  function ClearToken() {
    data.access_token = '';
    data.expires_at = 0;
  }
  
  function BackupDataToTemp() {
    local.tempData = clearReference(data);
  }
  
  function RestoreDataFromTemp() {
    if (local.tempData !== null) {
      data = clearReference(local.tempData);
    }
  }
  
  async function InitData(noReferenceData) {
    data = noReferenceData;
    
    let now = new Date().getTime();
    if (data.access_token != '') {
      reloadAuthState();
      await distributeTokenToComponentsAsync();
    } 
  }
  
  async function distributeTokenToComponentsAsync() {
    await TaskWaitUntil(() => typeof(drive) != 'undefined');
    drive.SetToken(data.access_token);
  }
  
  async function TaskAuthorize() {
    
    return new Promise(async resolve => {
      
      let now = new Date().getTime();
      let thirtySc = 30 * 1000;
      
      if (data.expires_at - now <= thirtySc) {
        while (local.isOnGoingAuthProcessStarted) {
          await TaskWaitUntil(CheckNoOngoingAuthProcess, 500);
        }
        RequestToken();
        await TaskWaitUntil(CheckNoOngoingAuthProcess, 500);
      } else {
        distributeTokenToComponentsAsync();
      }
      
      resolve();
    
    });
    
  }
  
  function CheckNoOngoingAuthProcess() {
    return !local.isOnGoingAuthProcessStarted;
  }
  
  function TaskWaitUntil(stateCheckCallback, delay = 100) {
    return new Promise(resolve => {
        let interval = window.setInterval(() => {
        let shouldResolve = stateCheckCallback();
        if (shouldResolve) {
            window.clearInterval(interval);
            resolve();
        }
        }, delay);
    });
}
  
  function clearReference(data) {
    return JSON.parse(JSON.stringify(data));
  }
  
  function InitTokenClient() {
    local.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: local.client_id,
      scope: local.scope,
      callback: (tokenResponse) => onTokenResponse(tokenResponse),
    });
  }
  
  function onTokenResponse(tokenResponse) {
    try {
      
      data.access_token = tokenResponse.access_token;
      data.expires_at = new Date(new Date().getTime() + tokenResponse.expires_in * 1000).getTime();
      Commit();
      
      readToken();
      
      distributeTokenToComponentsAsync();
      reloadAuthState();
      
    } catch (e) {
      console.error(e);
    }
    
    local.isOnGoingAuthProcessStarted = false;
    
  }
  
  function readToken() {
    if (typeof(data.email) != 'string' || data.email == '') {
      getTokenUserInfo(data.access_token);
    }
  }
  
   function getTokenUserInfo(access_token) {
    fetch('https://www.googleapis.com/oauth2/v3/tokeninfo', {
      headers: {
        authorization: `Bearer ${access_token}`
      }
    })
    .then(r => r.json())
    .then(json => {
      data.userEmail = json.email;
      Commit();
    });
  }
  
  // todo: move
  async function TaskInitCompoDrive() {
    await waitUntil(() => {
      return (typeof(drive) != 'undefined');
    });
    await drive.TaskReadAppData();
  }
  
  function waitUntil(stateCheckCallback, delay = 100) {
    return new Promise(resolve => {
        let interval = window.setInterval(() => {
        let shouldResolve = stateCheckCallback();
        if (shouldResolve) {
            window.clearInterval(interval);
            resolve();
        }
        }, delay);
    });
  }
  
  function RequestToken() {
    local.isOnGoingAuthProcessStarted = true;
    
    let opt = {};
    
    if (data.userEmail != '') {
      opt.hint = data.userEmail;
      opt.prompt = '';
    }
    
    local.tokenClient.requestAccessToken(opt);
  }
  
  function RevokeToken() {
    google.accounts.oauth2.revoke(data.access_token, () => { console.log('access token revoked'); });
  }
  
  function Commit() {
    appSettings.SetComponentData('compoGsi', clearReference(data));
    appSettings.Save();
  }
  
  return SELF;
  
})();