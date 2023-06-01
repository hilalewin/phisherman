from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app)


"""
 Received data and metadata of the email from the clinet,
 and perform an analysis to determine if the email is phishing    
"""
@app.route('/analyze', methods=['POST'])
def analyze():

    # Get the fields from the json
    data = request.get_json()
    
    sender_email =  data['senderEmail']
    time = data['time']
    subject = data['subject']
    content = data['content']
    links = data['links']
    print("Sender Email: " , sender_email)
    print("Time: " , time)
    print("Subject: " , subject)
    print("Content: " , content)
    print("Links: " , links)

    # Calculate the phishing prob based on the content
    


    
    
    analysis_result = {'content': content}
    return jsonify(analysis_result)

def analyze_phishing_content(content):
    return 1




if __name__ == '__main__':
    app.run()

