document.addEventListener('DOMContentLoaded', function() {
    
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');

    // Apply different background styles based on the message
    // if first time sending / phishing links
    if (message.includes("fts") || message.includes("pl") ) {
        document.body.classList.add('warning');
        document.getElementById('message-heading').textContent = 'Warning!';
        if (message.includes("fts")){
            document.getElementById('message-text1').textContent = "Warning: This is the first time you have received an email from this sender.\n"
        }
        else{
            document.getElementById('message-text1').style.display = "none"

        }
        if (message.includes("pl")){
            document.getElementById('message-text2').textContent =  "Warning: This email contains links that are identified as phishing.\n" 
        }
        else{
            document.getElementById('message-text2').style.display = "none"

        }
        if (message.includes("pc")){
            document.getElementById('message-text3').textContent = "Warning: The content of this email raises suspicion of phishing. \n"
        }
        else{
            document.getElementById('message-text3').style.display = "none"

        }
        
        document.getElementById('message-image').src = 'icons/warning-icon.svg';


      } else {
        document.body.classList.add('all_good');
        document.getElementById('message-heading').textContent = 'Great news!';
        document.getElementById('message-text1').textContent = "This email has been thoroughly checked, and we're happy to inform you that it appears to be safe and free from any phishing attempts.";
        document.getElementById('message-text2').style.display = "none"
        document.getElementById('message-text3').style.display = "none"

        document.getElementById('message-image').src = 'icons/rainbow-svgrepo-com.svg';
      }

    var exitButton = document.getElementById('exitButton');
    exitButton.addEventListener('click', function() {
      window.close();
    });
  });
  