# MoodTune: Facial Emotion-Based Music Recommender Web Application

MoodTune is a real-time web application developed as a Final Year Project. It uses computer vision and deep learning to detect facial expressions from a live webcam feed and automatically recommends matching music tracks via the Spotify Web API.
<img width="1070" height="496" alt="image" src="https://github.com/user-attachments/assets/f3bc28dc-2b5b-4aee-8e07-fb2254746cc7" />


---

## 📌 Features

- **Real-Time Facial Emotion Detection**: Classifies 7 universal emotions (*Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise*) from a webcam stream.
- **Lightweight Deep Learning Model**: Uses an optimized **MobileNetV2** CNN architecture for low-latency inference on consumer hardware.
- **Dynamic Music Recommendation**: Maps detected emotional states to music genres and queries the **Spotify Web API** for real-time track suggestions.
- **Interactive UI**: Responsive Neon Dark Mode dashboard with an embedded music player.
- **User History & Playlists**: View emotion history analytics and save favorite songs into mood-specific playlists.

---

## 🛠️ Tech Stack

- **Frontend**: React.js, Material UI (MUI), Axios
- **Backend**: Python, Flask REST API
- **AI & Computer Vision**: TensorFlow / Keras, OpenCV, MobileNetV2
- **Music Service**: Spotify Web API (Spotipy)
- **Data Storage**: JSON-based session persistence

---

## 📊 Model Performance

- **Dataset**: FER-2013 (48x48 grayscale facial images)
- **Validation Accuracy**: 66.0% (Comparable to human-level agreement benchmark)
- **Inference Latency**: ~0.3s (AI detection) | ~2.85s (Total system response including API calls)

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.8+
- Node.js & npm
- Spotify Developer Account (Client ID & Client Secret)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

### 3. Frontend Setup
Bash
cd frontend
npm install
npm start
