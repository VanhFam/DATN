import requests
import json

# Cấu hình
URL = "http://localhost:8001"
API_KEY = "datn_ai_secret_123"
HEADERS = {"x-api-key": API_KEY}

def test_face_recognition(photo_path_1, photo_path_2):
    print(f"--- Đang test AI với {photo_path_1} và {photo_path_2} ---")
    
    # 1. Trích xuất embedding từ ảnh 1
    with open(photo_path_1, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{URL}/extract-embedding", headers=HEADERS, files=files)
    
    if response.status_code != 200:
        print("Lỗi khi lấy embedding:", response.text)
        return

    embedding = response.json()['embedding']
    print("✓ Đã trích xuất thành công vector khuôn mặt.")

    # 2. So sánh với ảnh 2
    with open(photo_path_2, 'rb') as f:
        files = {'file': f}
        # Lưu ý: embedding_data được gửi dưới dạng string JSON
        data = {'embedding_data': json.dumps(embedding)}
        response = requests.post(f"{URL}/verify", headers=HEADERS, files=files, data=data)

    if response.status_code == 200:
        result = response.json()
        print("\n--- KẾT QUẢ ---")
        print(f"Khớp mặt: {result['match']}")
        print(f"Độ tin cậy (Confidence): {result['confidence']:.2%}")
        print(f"Khoảng cách (Distance): {result['distance']:.4f}")
    else:
        print("Lỗi khi xác thực:", response.text)

if __name__ == "__main__":
    # Bạn hãy thay 'anh_mau.jpg' và 'anh_test.jpg' bằng file ảnh thật của bạn
    print("Vui lòng chuẩn bị 2 file ảnh trong cùng thư mục này.")
    # test_face_recognition('anh_mau.jpg', 'anh_test.jpg')
