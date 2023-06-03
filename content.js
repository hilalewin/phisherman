chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'invokeFunction' && message.functionName === 'readingEmails') {
      // Access the token value from the message object
      const token = message.token;
      const legacyThreadId = document.querySelector('[role="main"] [data-legacy-thread-id]').getAttribute('data-legacy-thread-id');
      // Call your specific function with the token value
      readMessage(legacyThreadId,token);
    }
  });
  
function readMessage(messageId, token) {
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

  })
  .catch(error => {
      // Handle any errors that occurred during the API request
      
      console.error(error);
      
      // If the message was sent by the user, then the API call will return nothing.
      // (As wanted)
  });
}

function extractLinksFromSnippet(snippet) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = snippet.match(urlRegex);
    return matches || [];
}
  