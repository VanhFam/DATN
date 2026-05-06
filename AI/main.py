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

# Security: API Key lấy từ biến môi trường (mặc định nếu không có)
API_KEY = os.getenv("AI_SERVICE_KEY", "datn_ai_secret_123")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper: Kiểm tra API Key từ Header
async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Cảnh báo: API Key không hợp lệ!")
    return x_api_key

# Request Model cho việc so sánh
class VerifyRequest(BaseModel):
    embedding: List[float]  # Vector 128 chiều lấy từ DB
    threshold: float = 0.6  # Ngưỡng chấp nhận (càng thấp càng khắt khe)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Face Recognition AI"}

@app.post("/extract-embedding")
async def extract_embedding(
    file: UploadFile = File(...),
    api_key: str = Depends(verify_api_key)
):
    """
    Bước đăng ký: Nhận ảnh, trích xuất Vector 128 chiều và gửi về cho Backend lưu vào DB.
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Chuyển sang RGB cho face_recognition
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Tìm vị trí khuôn mặt
        face_locations = face_recognition.face_locations(rgb_img)
        if not face_locations:
            raise HTTPException(status_code=400, detail="Không tìm thấy khuôn mặt trong ảnh!")
        
        # Trích xuất embedding (lấy khuôn mặt đầu tiên)
        encodings = face_recognition.face_encodings(rgb_img, face_locations)
        if not encodings:
            raise HTTPException(status_code=400, detail="Không thể mã hóa khuôn mặt!")
            
        embedding = encodings[0].tolist()
        
        return {
            "success": True,
            "embedding": embedding,
            "face_count": len(encodings)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý ảnh: {str(e)}")

@app.post("/verify")
async def verify_face(
    embedding_data: str, # JSON string của vector 128 chiều
    file: UploadFile = File(...),
    threshold: float = 0.6,
    api_key: str = Depends(verify_api_key)
):
    """
    Bước điểm danh: Nhận ảnh chụp từ máy + Vector từ DB -> So sánh.
    """
    try:
        import json
        target_embedding = np.array(json.loads(embedding_data))
        
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        face_locations = face_recognition.face_locations(rgb_img)
        if not face_locations:
            return {"match": False, "message": "Không tìm thấy khuôn mặt"}
            
        current_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        
        # So sánh khuôn mặt chụp được với khuôn mặt mẫu
        # face_distance càng nhỏ thì càng giống nhau
        matches = face_recognition.compare_faces([target_embedding], current_encodings[0], tolerance=threshold)
        distance = face_recognition.face_distance([target_embedding], current_encodings[0])[0]
        
        # Tính toán độ tin cậy (Confidence score)
        confidence = 1 - distance
        
        return {
            "match": bool(matches[0]),
            "confidence": float(confidence),
            "distance": float(distance)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi so sánh: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
