document.addEventListener('DOMContentLoaded', function() {
    
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');

    // Apply different background styles based on the message
    // if first time sending / phishing links
    if (message.includes("fts") || message.includes("pl") ) {
        document.body.classList.add('warning');
        document.getElementById('message-heading').textContent = 'Warning!';
        if (message.includes("fts")){
            document.getElementById('message-text1').innerHTML =`
            <span><img src="icons/fts1.svg" class="bullet-icon" alt="Bullet Icon"></span>
            <span>This is the first time you have received</span>
            <br>
            <span>an email from this sender.</span>
          `;
        }
        else{
            document.getElementById('message-text1').style.display = "none"

        }
        if (message.includes("pl")){

            document.getElementById('message-text2').innerHTML =`
            <span><img src="icons/pl.svg" class="bullet-icon" alt="Bullet Icon"></span>
            <span>This email contains links that are</span>
            <br>
            <span>identified as phishing.</span>
          `;
        }
        else{
            document.getElementById('message-text2').style.display = "none"

        }
        if (message.includes("pc")){

            document.getElementById('message-text3').innerHTML =`
            <span><img src="icons/pc.svg" class="bullet-icon" alt="Bullet Icon"></span>
            <span>The content of this email raises</span>
            <br>
            <span>suspicion of phishing.</span>
          `;

        }
        else{
            document.getElementById('message-text3').style.display = "none"

        }
        
        document.getElementById('message-image').src = 'icons/warning-icon.svg';


      } else {
        document.body.classList.add('all_good');
        document.getElementById('message-heading').textContent = 'Great news!';
        document.getElementById('message-text1').innerHTML = '<span class="bullet-icon"><img src="icons/ok.ico" width="22" height="22" alt="Bullet Icon"></span>This email has been thoroughly checked, and we\'re happy to inform you that it appears to be safe and free from any phishing attempts.';
        document.getElementById('message-text2').style.display = "none"
        document.getElementById('message-text3').style.display = "none"

        document.getElementById('message-image').src = 'icons/rainbow-svgrepo-com.svg';
      }

    var exitButton = document.getElementById('exitButton');
    exitButton.addEventListener('click', function() {
      window.close();
    });
  });
  