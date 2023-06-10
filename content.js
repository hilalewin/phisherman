
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'invokeFunction' && message.functionName === 'readingEmails') {
      // Access the token value from the message object
      const token = message.token;
      const legacyThreadId = document.querySelector('[role="main"] [data-legacy-thread-id]').getAttribute('data-legacy-thread-id');
      const tabUrl = message.tabUrl; // Access the tab object
      const CONTENT_SCRIPT_RUN_FLAG = 'contentScriptHasRun';

      
      // Call your specific function with the token value
      
      if (token && legacyThreadId && tabUrl){
        const hasRun = localStorage.getItem(`${CONTENT_SCRIPT_RUN_FLAG}_${tabUrl}`);
        // !hasRun
        if (1) {
          await readMessageAndAnalyzeIfUnread(legacyThreadId,token);
          // Mark the content script as run for this tab
          localStorage.setItem(`${CONTENT_SCRIPT_RUN_FLAG}_${tabUrl}`, true);
        }
      }
      
    }
  });
  
  async function readMessageAndAnalyzeIfUnread(messageId, token) {
  
  const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
  fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(response => response.json())
    .then(async data => {
      const labelIds = data.labelIds;
      const isUnread = labelIds.includes("UNREAD");

      // Only if the message is unread
      // isUnread
      if (1){
        
        await analyzeMessage(data, token);
        }
      }
    )

    .catch(error => {
          // Handle any errors
          console.log(error)
    });
        
}

function decodeMessageBody(mtext){
  var message = "";
  if (mtext.length > 0) {
    // https://stackoverflow.com/questions/24464866/having-trouble-reading-the-text-html-message-part
    mtext = mtext.replace(/_/g, '/').replace(/-/g,'+');
    var decodedMessage = atob(mtext);
    message = new TextDecoder('utf-8').decode(new Uint8Array([...decodedMessage].map(char => char.charCodeAt(0))));
  }
  return message;
}

function getMessageBody(content) {
  var message = null;
  try {
    if ("data" in content.payload.body) {
      message = content.payload.body.data;
      message = decodeMessageBody(message);
    } else if ("data" in content.payload.parts[0].body) {
      message = content.payload.parts[0].body.data;
      message = decodeMessageBody(message);
    } else {
      console.log("body has no data.");
    }
  } catch (error) {
    alert(error);
  }
  return message;
}

function getSenderEmail(fromHeader) {
  try {
    const match = fromHeader.match(/<(.*?)>/);
    const email = match ? match[1] : null;
    return email;

  } catch (error) {
    return null;
  }
}

async function getCounterFromSender(senderEmail, token) {
  if (senderEmail == null) {
    return Promise.reject(new Error('Sender email is null'));
  }

  const url = `https://www.googleapis.com/gmail/v1/users/me/messages?q=from:${senderEmail}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    const resultSize = data.resultSizeEstimate;
    return resultSize;
  } catch (error) {
    // Handle any errors
    console.log(error);
    return -1;
  }
}


async function createAnalyzeRequestPayload(data, token) {
    // Extract the required data from the email
    const headers = data.payload.headers.reduce((acc, header) => {
      acc[header.name.toLowerCase()] = header.value;
      return acc;
    }, {});

    const email_content = getMessageBody(data);

    const links = extractLinksFromContent(email_content);

    const emailSender = getSenderEmail(headers.from);

    try {
      const counterFromSender = await  getCounterFromSender(emailSender, token);
      // Create the payload object
      const extractedData = {
        subject: headers.subject,
        time: headers.date,
        sender_email: headers.from,
        content: data.snippet,
        decoded_content: email_content,
        links: links,
        counter_from_sender: counterFromSender
      };
      return JSON.stringify(extractedData);
    }
    catch (error) {
    console.error(error);
    return null;
    }
}


function sendAnalyzeRequest(payload) {

  fetch('http://localhost:5000/analyze', {
  //fetch('https://vm.phishermen.xyz/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      })
        .then(response => response.json())
        .then(data => {
    
          alert(data['Answer']);
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

async function analyzeMessage(data, token) {

  const payload = await createAnalyzeRequestPayload(data, token);
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


function extractLinksFromContent(content) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = content.match(urlRegex);
    const uniqueMatches = [...new Set(matches)];
    return uniqueMatches || [];
}
  