import json

class Email:
    def __init__(self, sender_email, time, subject, content, links, decoded_content, counter_from_sender):
        self.sender_email = sender_email
        self.time = time
        self.subject = subject
        self.content = content
        self.links = links
        self.decoded_content  =  decoded_content 
        self.counter_from_sender = counter_from_sender
        
    def to_json(self):
        return json.dumps(self.__dict__)

    @classmethod
    def from_json(cls, json_str):
        data = json.loads(json_str)
        return cls(**data)
    
    def __str__(self):
        return f"Sender Email: {self.sender_email}\nTime: {self.time}\nSubject: {self.subject}\nContent: {self.content}\nLinks: {self.links}\nDecoded Content: {self.decoded_content}\nCounter from Sender: {self.counter_from_sender}"
