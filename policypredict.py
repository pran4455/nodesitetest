import sys
import pandas as pd
import sqlite3
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import unicodedata
import re
import json

def get_user_data(username):
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        cursor.execute("""
            SELECT gender, age, marital_status, salary, balance
            FROM users
            WHERE username = ?
        """, (username,))
        user_data = cursor.fetchone()
        conn.close()
        
        if user_data:
            return {
                'gender': user_data[0],
                'age': user_data[1],
                'marital_status': user_data[2],
                'salary': user_data[3],
                'balance': user_data[4]
            }
        return None
    except Exception as e:
        print(f"Database error: {str(e)}", file=sys.stderr)
        return None

def clean_text(text):
    # Convert to string if not already
    text = str(text)
    # Normalize unicode characters
    text = unicodedata.normalize('NFKD', text)
    # Remove non-ASCII characters
    text = re.sub(r'[^\x00-\x7F]+', '', text)
    # Replace multiple spaces with single space
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

# Load data
df = pd.read_excel("sbilife.xlsx")

# Clean policy names and descriptions
df['Policies'] = df['Policies'].apply(clean_text)
df['WhyGet'] = df['WhyGet'].fillna('').apply(clean_text)

# Store policy to WhyGet mapping
policy_descriptions = dict(zip(df['Policies'], df['WhyGet']))

# Encode policy names as labels
label_encoder = LabelEncoder()
df['Policy_Label'] = label_encoder.fit_transform(df['Policies'])

# Feature extraction from descriptions
vectorizer = TfidfVectorizer(stop_words='english', max_features=500)
X = vectorizer.fit_transform(df['Desc'].astype(str))
y = df['Policy_Label']

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train classifier
classifier = RandomForestClassifier(n_estimators=100, random_state=42)
classifier.fit(X_train, y_train)

def predict_policy(user_input, username=None):
    try:
        # Get user data if username is provided
        user_data = get_user_data(username) if username else None
        
        # Enhance user input with user data if available
        enhanced_input = user_input
        if user_data:
            enhanced_input = f"{user_input}. "
            enhanced_input += f"I am a {user_data['age']} year old {user_data['gender']}. "
            enhanced_input += f"I am {user_data['marital_status']}. "
            enhanced_input += f"My annual salary is {user_data['salary']} and I have a balance of {user_data['balance']}."
        
        user_vector = vectorizer.transform([enhanced_input])
        prediction = classifier.predict(user_vector)
        policy_name = clean_text(label_encoder.inverse_transform(prediction)[0])
        return {
            'name': policy_name,
            'why': policy_descriptions.get(policy_name, ''),
            'enhanced_query': enhanced_input
        }
    except Exception as e:
        return {
            'error': str(e)
        }

# Get user input from Node.js
if __name__ == "__main__":
    try:
        # Expect both user description and username
        user_description = sys.argv[1]
        username = sys.argv[2] if len(sys.argv) > 2 else None
        result = predict_policy(user_description, username)
        # Return JSON string that can be parsed by Node.js
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)
