from email.parser import Parser
import csv

MAX_LEN = 37000

def get_subject(email):
    return email['subject']

def get_to(email):
    return email['to']

def get_from(email):
    return email['from']

def get_body(email):
    return email.get_payload()

def get_body_without_past_message(email):
    return email.get_payload().split("-----Original Message-----")[0]

def read_file(file_to_read):

    with open(file_to_read, "r") as f:
        data = f.read()

    email = Parser().parsestr(data)

    return get_body_without_past_message(email)

def email_analyse(path):
    origal_data = read_file(path)
    trimmed_data = origal_data if len(origal_data) < MAX_LEN else origal_data[:MAX_LEN]
    content = [trimmed_data, 0] # 0 for non-phishing 
    with open('enron_emails.csv', mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(content)
    file.close()

# print(get_body_without_past_message("hello"))
# print(read_file("C:\\Users\\lilac\\Downloads\\enron_mail_20150507\\maildir\\dasovich-j\\all_documents\\29377"))

