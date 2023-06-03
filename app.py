import Email

from flask import Flask, request, jsonify
from flask_cors import CORS

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

    emailObj = Email.from_json(request.get_json())
    # Get the fields from the json
    print("Sender Email: " , emailObj.sender_email)
    print("Time: " , emailObj.time)
    print("Subject: " , emailObj.subject)
    print("Content: " , emailObj.content)
    print("Links: " , emailObj.links)

    # Calculate the phishing prob based on the content
    analysis_result = {'content': content}
    return jsonify(analysis_result)

def analyze_phishing_content(content):
    return 1




if __name__ == '__main__':
    app.run()

