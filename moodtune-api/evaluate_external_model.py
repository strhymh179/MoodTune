import torch
import torch.nn.functional as F
import numpy as np
import cv2
import os
import time
from sklearn.metrics import accuracy_score
import torch.nn as nn 

# --- CONFIGURATION (Ensure paths are correct) ---
MODEL_PATH = 'trained_facial_emotion_model.pt'
TEST_IMAGE_DIR = r'C:\Users\Administrator\moodtune-api\test' 

# Standard settings for FER-2013
TARGET_SIZE = (224, 224) 

EMOTION_LABELS_SET = {'angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral'}
EMOTION_LABELS = list(EMOTION_LABELS_SET) 

# --- Model Loading and Prediction ---

def load_model_and_predict(img_path):
    """Loads the model and performs prediction on a single image, bypassing face detection."""
    global model

    # 1. Preprocessing (Tensor conversion)
    img = cv2.imread(img_path)
    if img is None: return None

    # Resize to the model's expected size (224x224)
    img_resized = cv2.resize(img, TARGET_SIZE, interpolation=cv2.INTER_AREA)
    
    # Convert to RGB (3 channels)
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    
    # Convert to float tensor and add batch dimension (1, C, H, W)
    tensor = torch.from_numpy(img_rgb).float() / 255.0
    tensor = tensor.permute(2, 0, 1).unsqueeze(0) 

    # 2. Run Inference
    with torch.no_grad():
        output = None
        
        # --- FIX: AGGRESSIVE NETWORK ACCESS ATTEMPT ---
        # We try the standard call, and if it fails, we look inside known attribute names.
        
        try:
            output = model(tensor) # Attempt 1: Standard call (fails on wrapper)
        except (TypeError, RuntimeError): # Catch TypeError for 'not callable' and Runtime for shape mismatch
            if hasattr(model, 'net') and isinstance(model.net, nn.Module):
                output = model.net(tensor) # Attempt 2: Common PyTorch wrapper internal name
            elif hasattr(model, 'model') and isinstance(model.model, nn.Module):
                output = model.model(tensor) # Attempt 3: Another common internal name
            elif hasattr(model, 'classifier') and isinstance(model.classifier, nn.Module):
                output = model.classifier(tensor) # Attempt 4: Access the final layer
            elif hasattr(model, '_modules') and 'model' in model._modules:
                # Attempt 5: Final try accessing internal structure
                output = model._modules['model'](tensor)
            else:
                # If all else fails, raise the error specifically for debugging
                raise Exception("Prediction network attribute not found within loaded object.")
                
        
    probabilities = F.softmax(output, dim=1)
    predicted_index = torch.argmax(probabilities, dim=1).item()
    
    return predicted_index

# --- MAIN EXECUTION ---
print("--- STARTING EXTERNAL MODEL EVALUATION ---")

# 1. Load Model Weights (The critical step)
try:
    # Use the security bypass
    model = torch.load(MODEL_PATH, map_location=torch.device('cpu'), weights_only=False)
    # Ensure the model is set to evaluation mode if possible
    try:
        model.eval()
    except AttributeError:
        pass 
        
    print(f"✅ PyTorch Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"❌ FATAL ERROR: Could not load model. Reason: {e}")
    exit()

true_labels = []
predicted_labels = []
total_images = 0

# 2. Loop through all test images in the directory structure
for folder_name in os.listdir(TEST_IMAGE_DIR):
    folder_path = os.path.join(TEST_IMAGE_DIR, folder_name)
    
    # CHECK: If the directory name is one of the actual emotion names (e.g., 'Happy')
    if os.path.isdir(folder_path) and folder_name in EMOTION_LABELS_SET:
        true_emotion_name = folder_name 
        
        for filename in os.listdir(folder_path):
            if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                total_images += 1
                img_path = os.path.join(folder_path, filename)
                
                # Run Prediction
                try:
                    predicted_index = load_model_and_predict(img_path)
                except Exception as e:
                    # Catch prediction errors caused by unknown internal network structure
                    # We print the error message from the exception for external debugging
                    print(f"Warning: Failed to predict {filename}. Reason: {e}. Skipping.")
                    continue
                
                if predicted_index is not None:
                    # Map the predicted index (0-6) back to the emotion name
                    predicted_emotion_name = EMOTION_LABELS[predicted_index] 
                    
                    true_labels.append(true_emotion_name)
                    predicted_labels.append(predicted_emotion_name)

print(f"\n--- EVALUATION COMPLETE ---")

# 3. Calculate Final Accuracy
if total_images > 0:
    # We only calculate accuracy if we successfully append predictions to the lists
    if len(predicted_labels) > 0:
        accuracy = accuracy_score(true_labels, predicted_labels)
        print(f"Total Valid Predictions: {len(predicted_labels)}")
        print(f"External Model ACCURACY: {accuracy * 100:.2f}%")
    else:
        print("Total Valid Predictions: 0")
        print("Accuracy calculation failed because no valid predictions were generated.")
else:
    print("No images found in the test directory. Check your TEST_IMAGE_DIR path.")