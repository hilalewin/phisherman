chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'invokeFunction' && message.functionName === 'readingEmails') {
      // Access the token value from the message object
      const token = message.token;
      const legacyThreadId = document.querySelector('[role="main"] [data-legacy-thread-id]').getAttribute('data-legacy-thread-id');
      // Call your specific function with the token value
      readMessageAndAnalyzeIfUnread(legacyThreadId,token);
    }
  });
  
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
      if (1){
        
        analyzeMessage(data);
        }
        })
        .catch(error => {
              // Handle any errors
              console.log("error")
        });
        
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
}


function extractLinksFromSnippet(snippet) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = snippet.match(urlRegex);
    return matches || [];
}
  