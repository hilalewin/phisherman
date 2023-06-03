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
      changeInfo &&
      changeInfo.url &&
      //changeInfo.status (loading)
      changeInfo.url.includes('mail.google.com/mail/u/') &&
      changeInfo.url.includes('#inbox') &&
      !(changeInfo.url.slice(-6) === '#inbox') // !changeInfo.url.endswith('#inbox')
    ) {
     
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: (args) => {
          try {
            const { token } = args;
            const legacyThreadId = document.querySelector('[role="main"] [data-legacy-thread-id]').getAttribute('data-legacy-thread-id');
            chrome.runtime.sendMessage({ message: 'legacyThreadId', arg1: token, arg2: legacyThreadId });
            // Rest of the code
          } catch (error) {
            console.error('Error executing content script:', error);
            // Handle the error or display an alert/notification
          }
        },
        args: [{ token }],
      });
    }      
  })};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.message === 'legacyThreadId') {
    const arg1 = message.arg1;
    const arg2 = message.arg2;
    readMessage(arg1, arg2);
  }
});

function readMessage(messageId, token) {
  const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
  fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  .then(response => {
    if (!response) {
      console.error('Empty response');
    }
    return response.json();
  })
  .then(data => {

      const labelIds = data.labelIds;
      if (data.labelIds){
        const isUnread = labelIds.includes("UNREAD");

      }

      // Only if the message is unread
      // isUnread
      if (data && data.payload && data.payload.headers){

        // Extract the required data from the email
        const payload = data.payload;
        const headers = payload.headers.reduce((acc, header) => {
          acc[header.name.toLowerCase()] = header.value;
          return acc;
        }, {});

        const links = extractLinksFromSnippet(data.snippet);

        // Encoded, will fix later
        const body = payload.body.data;

        // Create the payload object
        const extractedData = {
          subject: headers.subject,
          time: headers.date,
          senderEmail: headers.from, 
          content: data.snippet,
          encoded_content: body,
          links: links 
        };

        /*
        const fromHeader = data.payload.headers.find(header => header.name.toLowerCase() === 'from');
        const senderValue = fromHeader ? fromHeader.value : '';
        const senderMatches = senderValue.match(/(.*)<(.+@[^>]+)>/);

        let senderName = '';
        let senderEmail = '';

        if (senderMatches) {
            senderName = senderMatches[1].trim();
            senderEmail = senderMatches[2].trim();
        } else {
            senderName = senderValue.trim();
        }
        */
      

        fetch('http://localhost:5000/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(extractedData),
        })
        .then(response => response.json())
          .then(data => {
            
            console.log(data['content']);
            /*
            alert(data['subject']);
            alert(data['links']);
            alert(data['content']);
            
            subject: headers.subject,
            time: headers.date,
            senderEmail: headers.from, 
            content: data.snippet,
            links: links
            alert(labelIds)
            */
          })
          .catch(error => {
              // Handle any errors
              if (error && error.message) {
                console.error('Error occurred:', error.message);
              } else {
                console.error('Unknown error occurred:', error);
              }
        });
        
          

      }

  })
  .catch(error => {
      // Handle any errors that occurred during the API request
      
      if (error && error.message) {
        console.error('Error occurred:', error.message);
      } else {
        console.error('Unknown error occurred:', error);
      }
      
      // If the message was sent by the user, then the API call will return nothing.
      // (As wanted)
  });
}

chrome.action.onClicked.addListener(browserActionClicked);
