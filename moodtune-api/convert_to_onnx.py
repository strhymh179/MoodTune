import tensorflow as tf
# Note: tf2onnx is typically installed via pip and needs to be imported here
import tf2onnx 
import os 
import sys

# --- CONFIGURATION (Match your final model settings) ---
# The file that currently WON'T load in app.py
INPUT_MODEL_PATH = 'mobilenetv2model.keras' 
# The new, stable deployment file name
OUTPUT_MODEL_PATH = 'mobilenetv2_deployment.onnx' 
# The target size of your MobileNetV2 input
TARGET_SIZE = (224, 224)
# Number of output classes (emotions)
NUM_CLASSES = 7

print(f"--- ONNX Conversion Script Started ---")
print(f"1. Attempting to load complex model: {INPUT_MODEL_PATH}")

try:
    # 1. Load the Keras model with compatibility settings
    # We must explicitly load layers here due to your previous deserialization errors
    # compile=False prevents issues with old optimizer data
    model = tf.keras.models.load_model(INPUT_MODEL_PATH, compile=False) 
    
    # 2. Define the input shape for the ONNX conversion (Batch Size 1, Color 3 channels)
    spec = (tf.TensorSpec([1, TARGET_SIZE[0], TARGET_SIZE[1], 3], tf.float32, name="input_0"),)
    
    print(f"2. Model loaded successfully. Converting to ONNX format...")
    
    # 3. Convert the model to ONNX format
    model_proto, external_tensor_storage = tf2onnx.convert.from_keras(
        model, 
        input_signature=spec, 
        opset=13, # Stable ONNX operator set
        output_path=OUTPUT_MODEL_PATH
    )
    
    print(f"\n✨ SUCCESS! Model converted and saved to: {OUTPUT_MODEL_PATH}")
    print("You can now update your app.py to load this .onnx file.")

except Exception as e:
    print("\n--- FATAL ERROR DURING RESAVE ---")
    print(f"Reason: {e}")
    print("\nAction: Ensure 'mobilenetv2model.keras' is in the directory and you ran 'pip install tf2onnx'.")