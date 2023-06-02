
function create_alert(msg) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon1.png',
    title: 'Phishrman',
    message: msg
    }
  );
}


/**
 * Get the user's access_token.
 *
 * @param {object} options
 *   @value {boolean} interactive - If the user is not authorized, should the auth UI be displayed.
 *   @value {function} callback - Async function to receive the getAuthToken result.
 */
function getAuthToken(options) {
  chrome.identity.getAuthToken({ interactive: options.interactive }, options.callback);
}

/**
 * Get the user's access_token or show the authorization UI if access has not been granted.
 */
function getAuthTokenInteractive() {
  getAuthToken({
    interactive: true,
    callback: handleAuthToken
  });
}

/**
 * If the user is authorized, start working.
 *
 * @param {string} token - User's access_token.
 *
 * 
*/

function handleAuthToken(token) {
  if (chrome.runtime.lastError) {
      chrome.action.setIcon({ path: 'red_icon.png' });
      console.error(chrome.runtime.lastError);


  } else {
    chrome.action.setIcon({ path: 'green_icon.png' });
    create_alert("Hi, welcome! All logged in!");
    addURLChangeListener(token);
  
  }
}

// Retrieve the stored access token
function getStoredAccessToken(callback) {
  chrome.storage.local.get(['access_token'], function(result) {
    if (chrome.runtime.lastError) {
      callback(null);
    } else {
      callback(result.access_token);
    }
  });
}

// User clicked on the browser action button. Check if the user is authenticated.
function browserActionClicked(tab) {
  // Check if access token is stored
  getStoredAccessToken(function(storedToken) {
    if (storedToken) {
      // Use the stored token
      create_alert("Hi, welcome back! Already logged in");

      
      chrome.action.setIcon({ path: 'green_icon.png' });
       addURLChangeListener(storedToken);
      
    } else {
      // Get a new access token
      getAuthTokenInteractive();
    }
  });
}


/**
   * Add a listener for URL changes.
   *
   * @param {string} token - User's access_token.
   */
function addURLChangeListener(token) {
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (
      changeInfo.url &&
      //changeInfo.status (loading)
      changeInfo.url.includes('mail.google.com/mail/u/') &&
      changeInfo.url.includes('#inbox') &&
      !(changeInfo.url.slice(-6) === '#inbox') // !changeInfo.url.endswith('#inbox')
    ) {
     
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          try {
            const legacyThreadId = document.querySelector('[role="main"] [data-legacy-thread-id]').getAttribute('data-legacy-thread-id');
            //readMessage(legacyThreadId, token);
            console.log(legacyThreadId)
            create_alert(legacyThreadId);
            //create_alert(token);
          } catch (error) {
            console.error('Error executing content script:', error);
            // Handle the error or display an alert/notification
          }
        },
      });
      

    }
  });
}




chrome.action.onClicked.addListener(browserActionClicked);

