from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import cv2
import base64
from flask_cors import CORS
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import random
import uuid
from passlib.context import CryptContext
import json
import os
import datetime
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenet_preprocess

# --- CONFIGURATION ---
MODEL_PATH = 'mobilenet_moodtune_70plus.h5' 
TARGET_SIZE = (224, 224)
EMOTION_LABELS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']

# --- MOOD TO GENRE MAPPING ---
MOOD_MAPPING = {
    'Angry': 'heavy metal, punk, hard rock',         
    'Disgust': 'experimental music, avant-garde',    
    'Fear': 'dark ambient, industrial, suspense',    
    'Happy': 'pop, dance, reggae, funk',             
    'Neutral': 'ambient, instrumental, classical',   
    'Sad': 'blues, slow ballads, acoustic',          
    'Surprise': 'dance pop, electro swing' 
}

DB_FILE = 'users.json'

# --- SPOTIFY CONFIG ---
SPOTIFY_CLIENT_ID = 'your_new_client_id'
SPOTIFY_CLIENT_SECRET = 'your_new_client_secret'
SECRET_KEY = 'your-very-secret-key'

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
app = Flask(__name__)
CORS(app) 

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def load_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'r') as f: 
                data = json.load(f)
                return data if data else {}
        except Exception as e: 
            print(f"Error reading DB: {e}")
            return {}
    return {}

def save_db(db_data):
    try:
        with open(DB_FILE, 'w') as f: 
            json.dump(db_data, f, indent=4)
    except Exception as e:
        print(f"Error saving DB: {e}")

# Initial Load
USER_DB = load_db()

try:
    MODEL = tf.keras.models.load_model(MODEL_PATH, compile=False) 
    print(f"Model loaded: {MODEL_PATH}")
except Exception as e:
    print(f"Error loading model: {e}")
    MODEL = None

try:
    sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
        client_id=SPOTIFY_CLIENT_ID, client_secret=SPOTIFY_CLIENT_SECRET
    ))
    print("🎶 Spotify initialized.")
except Exception as e:
    sp = None

def get_user_from_token(auth_header):
    if not auth_header: return None
    try:
        # Extracts 'id:username:key' from 'Bearer id:username:key'
        token = auth_header.split(" ")[1] if " " in auth_header else auth_header
        parts = token.split(":")
        if len(parts) >= 2:
            return parts[1] # Returns the username string
        return None
    except: return None

def preprocess_image(base64_img_string):
    encoded = base64_img_string.split(',', 1)[1] if ',' in base64_img_string else base64_img_string
    nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    roi = img[faces[0][1]:faces[0][1]+faces[0][3], faces[0][0]:faces[0][0]+faces[0][2]] if len(faces) > 0 else img
    resized = cv2.resize(cv2.cvtColor(roi, cv2.COLOR_BGR2RGB), TARGET_SIZE, interpolation=cv2.INTER_AREA)
    return mobilenet_preprocess(np.expand_dims(resized, axis=0))

def get_spotify_recommendation(emotion):
    fallback = {'track_uri': 'spotify:track:6rqhFgbbKwnb9MLmUQDhG6', 'track_list': []}
    if not sp: return fallback
    try:
        genre_query = MOOD_MAPPING.get(emotion, 'ambient')
        results = sp.search(q=f"{genre_query} mood", type='playlist', limit=5)
        playlists = results['playlists']['items']
        if not playlists: return fallback
        
        mega_track_pool = []
        for pl in playlists:
            try:
                tracks = sp.playlist_tracks(pl['id'], limit=50)
                for item in tracks['items']:
                    t = item.get('track')
                    if t and t.get('id'):
                        mega_track_pool.append({
                            "title": t['name'],
                            "artist": t['artists'][0]['name'] if t['artists'] else "Unknown",
                            "uri": t['uri']
                        })
            except: continue

        unique_tracks = list({t['uri']: t for t in mega_track_pool}.values())
        random.shuffle(unique_tracks)
        return {
            'track_uri': unique_tracks[0]['uri'] if unique_tracks else fallback['track_uri'], 
            'playlist_uri': playlists[0]['uri'], 
            'track_list': unique_tracks
        }
    except: return fallback

# --- AUTHENTICATION ROUTES ---

@app.route('/register', methods=['POST'])
def register():
    global USER_DB
    USER_DB = load_db() 
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username in USER_DB:
        return jsonify({"success": False, "message": "Username already exists"}), 409

    user_id = str(uuid.uuid4())
    USER_DB[username] = {
        "user_id": user_id,
        "password_hash": pwd_context.hash(password),
        "name": data.get('name', 'User'),
        "email": data.get('email', ''),
        "history": []
    }
    save_db(USER_DB)
    
    token = f"{user_id}:{username}:{SECRET_KEY}"
    return jsonify({"success": True, "message": "User registered successfully", "token": token}), 201

@app.route('/login', methods=['POST'])
def login():
    global USER_DB
    USER_DB = load_db() 
    data = request.get_json()
    username, password = data.get('username'), data.get('password')
    if username in USER_DB and pwd_context.verify(password, USER_DB[username]["password_hash"]):
        token = f"{USER_DB[username]['user_id']}:{username}:{SECRET_KEY}"
        return jsonify({"token": token, "success": True}), 200
    return jsonify({"message": "Invalid credentials"}), 401

# --- PROFILE & SECURITY ROUTES ---

@app.route('/update_profile', methods=['POST'])
def update_profile():
    global USER_DB
    USER_DB = load_db() 
    
    auth_header = request.headers.get('Authorization')
    old_username = get_user_from_token(auth_header)
    
    if not old_username or old_username not in USER_DB:
        return jsonify({"message": "Unauthorized session"}), 401
    
    data = request.get_json()
    new_username = data.get('username')
    new_name = data.get('name')
    new_email = data.get('email')

    current_user = old_username
    new_token = None

    #RENAME LOGIC: Move dictionary key if username changed
    if new_username and new_username != old_username:
        if new_username in USER_DB:
            return jsonify({"message": "Username already taken"}), 409
        
        print(f"Renaming user: {old_username} -> {new_username}")
        # Transfer data to new key
        user_data = USER_DB.pop(old_username)
        USER_DB[new_username] = user_data
        current_user = new_username
        
        #Generate a NEW token because the identity has changed
        new_token = f"{USER_DB[current_user]['user_id']}:{new_username}:{SECRET_KEY}"

    # Update other fields
    USER_DB[current_user]['name'] = new_name if new_name else USER_DB[current_user].get('name', '')
    USER_DB[current_user]['email'] = new_email if new_email else USER_DB[current_user].get('email', '')
    
    save_db(USER_DB)
    
    return jsonify({
        "success": True, 
        "message": "Profile updated!",
        "token": new_token # React must update its localStorage with this
    })

@app.route('/change_password', methods=['POST'])
def change_password():
    global USER_DB
    USER_DB = load_db()
    username = get_user_from_token(request.headers.get('Authorization'))
    if not username or username not in USER_DB:
        return jsonify({"message": "Unauthorized"}), 401
        
    data = request.get_json()
    old_pwd = data.get('old_password')
    new_pwd = data.get('new_password')
    
    if not pwd_context.verify(old_pwd, USER_DB[username]['password_hash']):
        return jsonify({"success": False, "message": "Incorrect current password."}), 401
        
    USER_DB[username]['password_hash'] = pwd_context.hash(new_pwd)
    save_db(USER_DB)
    return jsonify({"success": True, "message": "Password changed successfully!"})

# --- CORE FEATURES ---

@app.route('/predict_emotion', methods=['POST'])
def predict():
    global USER_DB
    USER_DB = load_db()
    username = get_user_from_token(request.headers.get('Authorization'))
    if not username or username not in USER_DB: 
        return jsonify({"message": "Unauthorized"}), 401
        
    data = request.get_json()
    try:
        processed = preprocess_image(data.get('image_data'))
        pred = MODEL.predict(processed, verbose=0)
        emotion = EMOTION_LABELS[np.argmax(pred[0])]
        rec = get_spotify_recommendation(emotion)
        
        USER_DB[username]['history'].insert(0, {
            "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
            "emotion": emotion,
            "track_name": rec['track_list'][0]['title'] if rec['track_list'] else "Discovery",
            "action": "Analyzed"
        })
        save_db(USER_DB)
        return jsonify({"emotion": emotion, "track_list": rec['track_list'], "track_uri": rec['track_uri'], "success": True})
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/profile', methods=['GET'])
def profile():
    global USER_DB
    USER_DB = load_db() 
    
    username = get_user_from_token(request.headers.get('Authorization'))
    
    if not username or username not in USER_DB:
        print(f"Profile Fetch Failed for username: '{username}'")
        print(f"Available Users in DB: {list(USER_DB.keys())}")
        return jsonify({"message": "Unauthorized session"}), 401
    
    user_data = USER_DB[username].copy()
    user_data['username'] = username
    return jsonify(user_data)

@app.route('/save_song', methods=['POST'])
def save_song():
    global USER_DB
    USER_DB = load_db()
    username = get_user_from_token(request.headers.get('Authorization'))
    if not username or username not in USER_DB: 
        return jsonify({"message": "Unauthorized"}), 401
        
    data = request.get_json()
    USER_DB[username]['history'].insert(0, {
        "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "emotion": data.get('current_emotion'),
        "track_name": data.get('song_title'),
        "uri": data.get('song_uri'),
        "action": "Saved"
    })
    save_db(USER_DB)
    return jsonify({"success": True, "message": "Song saved!"})

@app.route('/delete_song', methods=['POST'])
def delete_song():
    username = get_user_from_token(request.headers.get('Authorization'))
    if not username: return jsonify({"message": "Unauthorized"}), 401
    
    data = request.get_json()
    song_uri = data.get('uri')
    save_date = data.get('date')

    # Filter the history list to remove the specific song
    user_history = USER_DB[username]['history']
    USER_DB[username]['history'] = [
        item for item in user_history 
        if not (item.get('uri') == song_uri and item.get('date') == save_date)
    ]
    
    save_db(USER_DB)
    return jsonify({"success": True, "message": "Song removed!"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
