from Email import Email
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import ssl
from feature import FeatureExtraction
import numpy as np
import warnings
import time
import threading


# ML
import pickle

# Specify the path to the pickle file containing the trained model
model_path = 'naive_bayes_model.pkl'


# Load the model from the pickle file
with open(model_path, 'rb') as file:
    loaded_model = pickle.load(file)
    vectorizer = loaded_model[1]
    model = loaded_model[0]
file.close()


model_path = 'gradient_boosting_model.pkl'

# Load the model from the pickle file
with open(model_path, 'rb') as file:
    gbc = pickle.load(file)
file.close()


app = Flask(__name__)
cors = CORS(app)

# Create a lock object
unique_requests_lock = threading.Lock()

# Create a set to store the unique request hashes
unique_requests = set()

"""
 Received data and metadata of the email from the clinet,
 and perform an analysis to determine if the email is phishing    
"""
@app.route('/analyze', methods=['POST'])
def analyze():
    emailObj = Email.from_json(request.get_data())

    request_data = emailObj.messageId
    request_hash = hash(request_data)

    # Check if the request is already in unique_requests
    # Do it with a lock
    with unique_requests_lock:
        if request_hash in unique_requests:
            return "Duplicate request ignored."
        else:
            unique_requests.add(request_hash)
    
    # Calculate the phishing prob based on the content
    msg = create_analyze_phishing(emailObj.decoded_content, emailObj.counter_from_sender, emailObj.links)          
    analysis_result = {'Answer': msg}

    # Waiting some time before removing from the list
    # This is the time that a new requests will recieved
    time.sleep(0.5)

    # Remove the request hash from unique_requests
    with unique_requests_lock:
        unique_requests.remove(request_hash)

    return jsonify(analysis_result)

def analyze_phishing_content(content):
    #preprocessed_content = preprocess(content)  # Preprocess the question using your preprocessing steps
    vectorized_content = vectorizer.transform([content])  # Transform the question into a numerical representation

    # Classify the question
    predicted_label = model.predict(vectorized_content)[0]  # Get the predicted class label
    probability_scores = model.predict_proba(vectorized_content)[0]  # Get the probability scores for each class

    # Print the predicted label and probability scores
    #print("Predicted Label:", predicted_label)
    ##print("Probability Scores:", probability_scores)
    return predicted_label

def analyze_phishing_links(links):

    bad_links = []
    for link in links:
        obj = FeatureExtraction(link)
        x = np.array(obj.getFeaturesList()).reshape(1,14) 
        y_pred =gbc.predict(x)[0]
        # 1 is phishing, 0 is non phishing
        if y_pred == 1:
            bad_links.append(link)
    return bad_links
       


# Analyze the probability to be phishing
def create_analyze_phishing(content,counter_from_sender, links):


    bad_links = analyze_phishing_links(links)

    predicted_label_content = analyze_phishing_content(content)

    # pc = phishing content
    # pl = phishing links
    # fts = first time sending

    res = [] 

    # We only care if it is the first time receving from sender / gotten phishing emails
    if counter_from_sender == True:
        res.append("fts")
    if len(bad_links) > 0:
        res.append("pl")
    if predicted_label_content == 1:
        res.append("pc")

    # TODO: maybe pass a dict so we can pass the bad links as well?
    return res 


if __name__ == '__main__':
    """
    logging.basicConfig(level=logging.DEBUG)
    cert = '/etc/letsencrypt/live/vm.phishermen.xyz/cert.pem'
    key = '/etc/letsencrypt/live/vm.phishermen.xyz/privkey.pem'
    context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
    context.load_cert_chain(cert,key)

    app.run(host = '0.0.0.0', port=443, debug = True, ssl_context = context)
    """
    app.run()
