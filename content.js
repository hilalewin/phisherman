
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'invokeFunction' && message.functionName === 'readingEmails') {
      // Access the token value from the message object
      const token = message.token;
      const legacyThreadId = document.querySelector('[role="main"] [data-legacy-thread-id]').getAttribute('data-legacy-thread-id');
      const tabUrl = message.tabUrl; // Access the tab object

      // Call your specific function with the token value      
      if (token && legacyThreadId && tabUrl){
          await readMessageAndAnalyzeIfUnread(legacyThreadId,token);
      }
      
    }
  });
  
  async function readMessageAndAnalyzeIfUnread(messageId, token) {
  
  const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    const labelIds = await data.labelIds;
    const isUnread = await labelIds.includes("UNREAD");

    // Only if the message is unread
    // isUnread
    if (isUnread){
      await analyzeMessage(data, token, messageId);
    }
  }
  catch(error) {
          // Handle any errors
          console.log(error)
    };
   
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

// 1 for first time, 0 for else
async function getFirstTimeFromSender(senderEmail, token) {
  if (senderEmail == null) {
    return Promise.reject(new Error('Sender email is null'));
  }

  // Use cache to store it
  chrome.storage.local.get(`${senderEmail}`, function(result) {
    if (result[`${senderEmail}`]) {
      return false;
    }
  });
  

  const url = `https://www.googleapis.com/gmail/v1/users/me/messages?q=from:${senderEmail}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    const resultSize = data.resultSizeEstimate;
    // Setting the cache
    chrome.storage.local.set({ [`${senderEmail}`]: true });
    return resultSize === 1;
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
      const isFirstTimeFromSender = await  getFirstTimeFromSender(emailSender, token);
      // Create the payload object
      const extractedData = {
        messageId: data.id,
        subject: headers.subject,
        time: headers.date,
        sender_email: headers.from,
        content: data.snippet,
        decoded_content: email_content,
        links: links,
        counter_from_sender: isFirstTimeFromSender
      };
      return JSON.stringify(extractedData);
    }
    catch (error) {
    console.error(error);
    return null;
    }
}


async function sendAnalyzeRequest(payload) {

  // 'https://vm.phishermen.xyz/analyze',
  try {
    const response = await fetch('http://localhost:5000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    });
  
   const data = await response.json();
          //alert(data['Answer']);
    chrome.runtime.sendMessage({ action: "createPopup", message: data['Answer'] }, function(response) {
      console.log(response.message);
    });
  }
  catch(error) {
    // Handle any errors
    console.log("error")
  };
}

async function analyzeMessage(data, token, messageId) {

  //const hasRun = localStorage.getItem(`${CONTENT_SCRIPT_RUN_FLAG}_${messageId}`);
//  if (!hasRun) {
  const payload = await createAnalyzeRequestPayload(data, token);
    if (payload) {
      await sendAnalyzeRequest(payload);
    }
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
  //}
  //else {
    // Mark the content script as run for this tab
    //localStorage.setItem(`${CONTENT_SCRIPT_RUN_FLAG}_${messageId}`, true);
 // }
}


function extractLinksFromContent(content) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = content.match(urlRegex);
    const uniqueMatches = [...new Set(matches)];
    return uniqueMatches || [];
}
  