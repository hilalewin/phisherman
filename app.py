from Email import Email
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import ssl

# ML
from sklearn.naive_bayes import MultinomialNB



app = Flask(__name__)
cors = CORS(app)


"""
 Received data and metadata of the email from the clinet,
 and perform an analysis to determine if the email is phishing    
"""
@app.route('/analyze', methods=['POST'])
def analyze():

    
    emailObj = Email.from_json(request.get_data())
    # Get the fields from the json
    print("Sender Email: " , emailObj.sender_email)
    print("Time: " , emailObj.time)
    print("Subject: " , emailObj.subject)
    print("Content: " , emailObj.content)
    print("Links: " , emailObj.links)

    # Calculate the phishing prob based on the content
    analysis_result = {'content': emailObj.content}
    return jsonify(analysis_result)

def analyze_phishing_content(content):
    return 1




if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    cert = '/etc/letsencrypt/live/vm.phishermen.xyz/cert.pem'
    key = '/etc/letsencrypt/live/vm.phishermen.xyz/privkey.pem'
    context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
    context.load_cert_chain(cert,key)

    app.run(host = '0.0.0.0', port=443, debug = True, ssl_context = context)

