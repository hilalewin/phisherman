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
  if (!token) {
    chrome.action.setIcon({ path: 'red_icon.png' });
    console.error(chrome.runtime.lastError);
  } else {
    setStoredAccessToken(token, function() {
      create_alert("Hi, welcome! All logged in!");
      chrome.action.setIcon({ path: 'green_icon.png' });
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

// Store the access token
function setStoredAccessToken(token, callback) {
  chrome.storage.local.set({ 'access_token': token }, function() {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else {
      console.log('Access token stored successfully');
    }
    if (callback) {
      callback();
    }
  });
}


// User clicked on the browser action button. Check if the user is authenticated.
function browserActionClicked(tab) {
  // Check if access token is stored
  getStoredAccessToken(function(storedToken) {
    if (storedToken) {
      checkAccessTokenValidity(storedToken)
      .then(isValid => {
        if (isValid) {
            create_alert("Hi, welcome back! Already logged in");
            chrome.action.setIcon({ path: 'green_icon.png' });
        }
        else {
          getAuthTokenInteractive();
        }
      })
      .catch(error => {
        console.error('Error checking access token validity:', error);
        chrome.action.setIcon({ path: 'red_icon.png' });

      });
  }
  else {
    getAuthTokenInteractive();
  }
  });
}

function checkAccessTokenValidity(accessToken) {
  return fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .then(response => {
      if (response.status === 200) {
        return true;
      } else if (response.status === 401) {
        return false;
      }
    })
    .catch(error => {
      console.error('Error checking access token validity:', error);
      throw error; // Rethrow the error for the caller to handle
    });
}

chrome.action.onClicked.addListener(browserActionClicked);

function browserInjectiF(tabId, changeInfo, tab){
   // Check if access token is stored
   getStoredAccessToken(function(storedToken) {
    if (storedToken) {
      // Use the stored token
      if (changeInfo.status === 'loading' && changeInfo.url &&
        changeInfo.url.includes('mail.google.com/mail/u/') &&
        changeInfo.url.includes('inbox') &&
        !(changeInfo.url.slice(-5) === 'inbox')
        ) {
            // Inject content script into the current tab
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content.js']
            }, function() {
              // Once the script is injected, send a message to the content script
              chrome.tabs.sendMessage(tabId, { action: 'invokeFunction', functionName: 'readingEmails', token: storedToken, tabUrl: changeInfo.url });
            });
          }
        }
      }
    );
}

// Add the tab update event listener outside the handleAuthToken function
chrome.tabs.onUpdated.addListener(browserInjectiF);

  