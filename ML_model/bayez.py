from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics import accuracy_score, confusion_matrix
import pandas as pd
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
import pickle

import os

# https://www.kaggle.com/datasets/llabhishekll/fraud-email-dataset 
# https://github.com/sadat1971/Phishing_Email/blob/main/Data/curated_set.csv 
# https://www.kaggle.com/code/danielbeltsazar/email-spam-classification-nlp/input
dataset = [r".\curated_set_imporoved.csv"]

datasets = [r".\fraud_email_.csv", \
            r".\SPAM_text_message.csv", \
            r".\curated_set_imporoved.csv"]

# Global vars
gacc = 0
gtn = 0
gfp = 0
gfn = 0
gtp = 0
accuracy = 0

# Set some formatting options
pd.options.display.max_columns = None
pd.options.display.width = None
pd.set_option('display.expand_frame_repr', False)

# Create the model instance once
model = MultinomialNB()
vectorizer = CountVectorizer()


print("\n\nPrinting result for  support vector machines\n")

for db in dataset:

    # Load the phishing email dataset
    df = pd.read_csv(db)

    df = df.dropna()

    filename = os.path.basename(db)
    print("\nFor filename: ", filename, " with ", str(len(df)) + " rows.")

    # Separate the text and labels
    text = df['text']
    labels = df['label']

    # Convert the text to a numerical representation using bag-of-words
    X = vectorizer.fit_transform(text)

    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, labels, test_size=0.2)

    # Train the Naive Bayes model
    model.fit(X_train, y_train)

    # Make predictions on the testing set
    y_pred = model.predict(X_test)

    # Evaluate the accuracy of the model
    accuracy = accuracy_score(y_test, y_pred)
    gacc += round(accuracy, 5)
    print('\nAccuracy:', round(accuracy, 5))

    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    gtn += tn
    gfp += fp
    gfn += fn
    gtp += tp

    table = pd.DataFrame({
        'TP': [tp],
        'FP': [fp],
        'TN': [tn],
        'FN': [fn]
    })


    # Loop over the rows of the DataFrame
    for index, row in table.iterrows():
        # Print the row name and its values
        print(f"Phishing -> found phishing: {row['TP']}")
        print(f"Non-Phishing -> found phishing: {row['FP']}")
        print(f"Non-Phishing -> found non-phishing: {row['TN']}")
        print(f"Phishing -> found non-phishing: {row['FN']}")

    # Print the DataFrame with nicer formatting
    # print(table.to_string(index=False))

# Save the trained model to a file
if accuracy > 0.95:
    with open("naive_bayes_model.pkl", "wb") as f:
        pickle.dump((model, vectorizer), f)

"""
print("\nOverall results")
print('\nAccuracy:', round(gacc/3, 5))
print(f"Phishing -> found phishing: {round(gtp/3, 5)}")
print(f"Non-Phishing -> found phishing: {round(gfp/3, 5)}")
print(f"Non-Phishing -> found non-phishing: {round(gtn/3, 5)}")
print(f"Phishing -> found non-phishing: {round(gfn/3, 5)}")
"""