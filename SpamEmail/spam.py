import pickle

def load_model():
    try:
        # Load the trained model
        with open('spamDetection_model.pkl', 'rb') as model_file:
            spam_classifier = pickle.load(model_file)
        
        # Load the vectorizer separately
        with open('vectorizer.pkl', 'rb') as vectorizer_file:
            vectorizer = pickle.load(vectorizer_file)
        
        return spam_classifier, vectorizer
    except Exception as e:
        print(f"Error loading model or vectorizer: {str(e)}")
        return None, None

def predict_spam(text, threshold=0.8):
    # Load the model and vectorizer
    classifier, vectorizer = load_model()
    
    if classifier is None or vectorizer is None:
        return "Error: Could not load the model or vectorizer"
    
    try:
        # Transforming the text using the loaded vectorizer
        text_vectorized = vectorizer.transform([text])
        
        # Getting the probability scores for both classes (ham and spam)
        probabilities = classifier.predict_proba(text_vectorized)[0]
        
        # If the probability for spam (index 1) is above the threshold, classify as Spam
        if probabilities[1] > threshold:
            return "Spam"
        else:
            return "Not Spam"
        
    except Exception as e:
        return f"Error making prediction: {str(e)}"
    
# Flask app example
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    result = predict_spam(text)
    return jsonify({'prediction': result})

if __name__ == '__main__':
    app.run(debug=True)