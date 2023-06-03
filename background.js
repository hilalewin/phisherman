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
    // Inject content script into the current tab
    // The website must load
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
      changeInfo &&
      changeInfo.status === 'loading' && changeInfo.url &&
      
      //changeInfo && changeInfo.url &&
      changeInfo.url.includes('mail.google.com/mail/u/') &&
      changeInfo.url.includes('inbox') &&
      !(changeInfo.url.slice(-5) === 'inbox') // !changeInfo.url.endswith('#inbox')
      
      ) {
        create_alert(changeInfo.url)
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["content.js"]
        }, () => {
          // Once the script is injected, send a message to the content script
          chrome.tabs.sendMessage(tabId, { action: 'invokeFunction', functionName: 'readingEmails', token: token });
        });
      }
    });

  
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
      
      // Inject content script into the current tab
      // Todo???
      

    } else {
      // Get a new access token
      getAuthTokenInteractive();
    }
  });
}

chrome.action.onClicked.addListener(browserActionClicked);
