from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import numpy as np
import os

app = Flask(__name__)
model = SentenceTransformer('all-MiniLM-L6-v2')

NSFW_DOMAINS = ['pornhub.com', 'xvideos.com', 'xnxx.com', 'redtube.com', 'youporn.com']
NSFW_KEYWORDS = ['porn', 'xxx', 'sex', 'nude', 'nsfw', 'adult', 'explicit']
NSFW_URL_PATTERNS = ['porn', 'xxx', 'sex', 'nude', 'nsfw', 'adult', 'explicit', 'onlyfans', 'hentai', 'erotic']

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

@app.route('/embed', methods=['POST'])
def embed():
    data = request.json
    text = data.get('text', '')
    if not text:
        return jsonify({'error': 'text is required'}), 400
    embedding = model.encode(text).tolist()
    return jsonify({'embedding': embedding}), 200

@app.route('/find-similar', methods=['POST'])
def find_similar():
    data = request.json
    text = data.get('text', '')
    categories = data.get('categories', [])
    
    if not text or not categories:
        return jsonify({'error': 'text and categories are required'}), 400
    
    text_embedding = model.encode(text)
    best_match = None
    best_similarity = 0
    
    for category in categories:
        if not category.get('embedding'):
            continue
        cat_embedding = np.array(category['embedding'])
        similarity = np.dot(text_embedding, cat_embedding) / (np.linalg.norm(text_embedding) * np.linalg.norm(cat_embedding))
        if similarity > best_similarity:
            best_similarity = similarity
            best_match = category
    
    if best_match:
        return jsonify({'categoryId': best_match['_id'], 'similarity': float(best_similarity)}), 200
    return jsonify({'categoryId': None, 'similarity': 0}), 200

@app.route('/check-nsfw', methods=['POST'])
def check_nsfw():
    data = request.json
    url = data.get('url', '').lower()
    window_title = data.get('window_title', '').lower()
    
    flagged = False
    reason = ''
    confidence = 0
    
    # Check domain blocklist
    for domain in NSFW_DOMAINS:
        if domain in url:
            flagged = True
            reason = f'Blocked domain: {domain}'
            confidence = 0.95
            break
    
    # Check URL path and query parameters (e.g., youtube.com/watch?v=xxx)
    if not flagged:
        for pattern in NSFW_URL_PATTERNS:
            if pattern in url:
                flagged = True
                reason = f'NSFW pattern in URL: {pattern}'
                confidence = 0.80
                break
    
    # Check window title keywords
    if not flagged:
        for keyword in NSFW_KEYWORDS:
            if keyword in window_title:
                flagged = True
                reason = f'NSFW keyword in title: {keyword}'
                confidence = 0.75
                break
    
    return jsonify({'flagged': flagged, 'reason': reason, 'confidence': confidence}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
