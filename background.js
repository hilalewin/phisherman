
/**
 * Get the user's access_token.
 *
 * @param {object} options
 * @value {boolean} interactive - If the user is not authorized, should the auth UI be displayed.
 * @value {function} callback - Async function to receive the getAuthToken result.
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
 */
function handleAuthToken(token) {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
  } else {
    // User is authorized, perform further operations using the token
    console.log("Authorization successful!");
    addURLChangeListener(token);
  }
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
      changeInfo.url.includes('inbox') &&
      !(changeInfo.url.slice(-6) === 'inbox') // !changeInfo.url.endswith('#inbox')
    ) {
      chrome.tabs.executeScript(tabId, { code: 'document.querySelector(\'[role="main"] [data-legacy-thread-id]\').getAttribute(\'data-legacy-thread-id\')' },
        function (result) {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
          } else if (result && result.length > 0) {
            const dataLegacyThreadId = result[0];
            //alert(token);
            //alert(dataLegacyThreadId);
            readMessageAndAnalyzeIfUnread(dataLegacyThreadId, token);
          }
        });
    }
  });
}

/**
 * User clicked on the browser action button. Check if the user is authenticated.
 *
 * @param {object} tab - Chrome tab resource.
 */
function browserActionClicked(tab) {
  getAuthTokenInteractive();
}

function decodeMessageBody(encodedData) {
  // TODO: decode data
  return encodedData;
}

function createAnalyzeRequestPayload(data) {
  // Extract the required data from the email
  const headers = data.payload.headers.reduce((acc, header) => {
    acc[header.name.toLowerCase()] = header.value;
    return acc;
  }, {});

  const links = extractLinksFromSnippet(data.snippet);

  const body = decodeMessageBody(data.payload.body.data);

  // Create the payload object
  const extractedData = {
    subject: headers.subject,
    time: headers.date,
    senderEmail: headers.from,
    content: data.snippet,
    encoded_content: body,
    links: links
  };

  return JSON.stringify(extractedData);
}

function sendAnalyzeRequest(payload) {
  fetch('http://localhost:5000/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
  })
    .then(response => response.json())
    .then(data => {

      alert(data['content']);
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
      console.log("error")
    });
}

function analyzeMessage(data) {
  const payload = createAnalyzeRequestPayload(data);
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
  sendAnalyzeRequest(payload);
  // Create and display the popup with email details
  createPopup(content, senderName, senderEmail, time, subject, links, length);

}

function readMessageAndAnalyzeIfUnread(messageId, token) {
  const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
  fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(response => response.json())
    .then(data => {
      const labelIds = data.labelIds;
      const isUnread = labelIds.includes("UNREAD");

      // Only if the message is unread
      // isUnread
      if (1) { // TODO: change back to unread
        analyzeMessage(data);
      }

    })
    .catch(error => {
      // Handle any errors that occurred during the API request
      console.error(error);
      // If the message was sent by the user, then the API call will return nothing.
      // (As wanted)
    });
}

// Wire up Chrome event listener
chrome.browserAction.onClicked.addListener(browserActionClicked);

function extractLinksFromSnippet(snippet) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = snippet.match(urlRegex);
  return matches || [];
}

// Create a popup with email details
function createPopup(content, senderName, senderEmail, time, subject, links, length) {
  const formattedLinks = links.map(link => `<a href="${link}" target="_blank">${link}</a>`).join(', ');
  const popupHTML = `
      <div style="padding: 10px;">
        <h2>Email Details</h2>
        <p><strong>Sender Name:</strong> ${senderName}</p>
        <p><strong>length is :</strong> ${length}</p>
        <p><strong>Sender Email:</strong> ${senderEmail}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <p>${content}</p>
        ${links.length > 0 ? `<p><strong>Links:</strong> ${formattedLinks}</p>` : ''}
        </div>
    `;

  const popupWindow = window.open('', '', 'width=400,height=400');
  popupWindow.document.open();
  popupWindow.document.write(popupHTML);
  popupWindow.document.close();
}
