import torch
import torch.nn.functional as F
import numpy as np
import cv2
import os
import time

# --- CONFIGURATION (Must match the model's training setup) ---
MODEL_PATH = "trained_facial_emotion_model.pt"
EMOTION_LABELS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']
TARGET_SIZE = (224, 224) 
IMAGE_FILE = 'test_face.jpg' # Sample image to test against

# NOTE: The custom helper function 'preprocess_and_predict' is no longer used, 
# as we rely on the FER library's built-in detector object.
# The previous Helper Functions block should be entirely removed/replaced by the main execution below.

# --- MAIN EXECUTION ---
print("--- Starting Local Model Test ---")

# 1. Load the model (We still need to load the .pt file)
try:
    # Use the security bypass to allow custom classes to load
    model = torch.load(MODEL_PATH, map_location=torch.device('cpu'), weights_only=False)
    print(f"✅ Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"❌ ERROR: Could not load PyTorch model. Check 'fer' installation.")
    print(f"Reason: {e}")
    exit()

# 2. Load the image
if not os.path.exists(IMAGE_FILE):
    print(f"❌ ERROR: Test image '{IMAGE_FILE}' not found. Please create it.")
    exit()
    
# cv2.imread loads image as BGR
img = cv2.imread(IMAGE_FILE) 

# 3. Create the FER Detector Instance (This is the intended use of the external library)
try:
    # We instantiate the FER detector object directly using the loaded model file
    from fer import FER
    detector = FER(mtcnn=False, device='cpu', emotion_classifier=model)
    print("✅ FER Detector initialized.")
except Exception as e:
    print(f"❌ FATAL ERROR: Could not initialize FER detector. Reason: {e}")
    exit()


# 4. Run Prediction using the FER object's public method
start_time = time.time()
try:
    # The detector analyzes the image and returns a list of detected faces and their emotions
    # This public method handles all preprocessing, face detection, and classification internally.
    results = detector.detect_emotions(img)
    inference_time = (time.time() - start_time) * 1000

    if not results:
        predicted_emotion = "No Face Detected"
        final_confidence = {}
    else:
        # Get the first (largest) detected face
        main_face = results[0]
        final_confidence = main_face['emotions']
        
        # Determine the dominant emotion
        predicted_emotion = max(final_confidence, key=final_confidence.get)


    # 5. Display Results
    print("\n--- PREDICTION RESULT ---")
    print(f"Image Tested: {IMAGE_FILE}")
    print(f"Detected Emotion: {predicted_emotion}")
    print(f"Inference Time: {inference_time:.2f} ms")

    print(f"\nCONFIDENCE SCORES:\n{final_confidence}")

except Exception as e:
    print(f"\n❌ PREDICTION CRASHED: {e}")
    print("Action: The FER detector failed during image processing.")