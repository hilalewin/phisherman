import os
from Enron2 import email_analyse
import csv

rootdir = "C:\\Users\\lilac\\Downloads\\enron_mail_20150507\\maildir\\"

with open('enron_emails.csv', mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(["Email body", "Phishing"])
file.close

for directory, subdirectory, filenames in  os.walk(rootdir):
    for filename in filenames:
        email_analyse(os.path.join(directory, filename))

# email_analyse("C:\\Users\\lilac\\Downloads\\enron_mail_20150507\\maildir\\dasovich-j\\all_documents\\29377")



