import os
import io
import cv2
import numpy as np
import face_recognition
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn
from pydantic import BaseModel

app = FastAPI(title="Face Recognition AI Service")

# Security: Simple API Key
API_KEY = os.getenv("AI_SERVICE_KEY", "datn_ai_secret_123")

# Performance: CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class VerifyRequest(BaseModel):
    embedding: List[float]  # The stored embedding from DB
    threshold: float = 0.6  # Confidence threshold

@app.get("/health")
def health_check():
    return {"status": "healthy"}

def get_face_encoding(image_bytes):
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image data")
    
    # Convert BGR (OpenCV) to RGB (face_recognition)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Detect face and encode
    encodings = face_recognition.face_encodings(rgb_img)
    
    if len(encodings) == 0:
        return None
    
    return encodings[0]

@app.post("/encode")
async def encode_face(file: UploadFile = File(...), api_key: str = Header(None)):
    """
    Takes an image and returns the 128-d face embedding.
    Used during student registration.
    """
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    content = await file.read()
    encoding = get_face_encoding(content)
    
    if encoding is None:
        raise HTTPException(status_code=422, detail="No face detected in image")
        
    return {"embedding": encoding.tolist()}

@app.post("/verify")
async def verify_face(
    file: UploadFile = File(...), 
    stored_embedding: str = Header(...), # Sent as JSON string or comma-separated
    api_key: str = Header(None)
):
    """
    Compares a new image against a stored embedding.
    """
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # 1. Get embedding from current image
    content = await file.read()
    current_encoding = get_face_encoding(content)
    
    if current_encoding is None:
        return {"match": False, "confidence": 0, "message": "No face detected"}

    # 2. Parse stored embedding
    try:
        target_encoding = np.array([float(x) for x in stored_embedding.split(',')])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid stored_embedding format")

    # 3. Compare
    # face_distance returns the Euclidean distance (lower is better match)
    distance = face_recognition.face_distance([target_encoding], current_encoding)[0]
    
    # Get threshold from header or default
    threshold = 0.6 # You can make this dynamic
    
    match = bool(distance <= threshold)
    confidence = (1 - distance) if distance < 1 else 0
    
    return {
        "match": match,
        "confidence": float(confidence),
        "distance": float(distance)
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
