# Hệ Thống Điểm Danh Thông Minh (Attendance AI)

Dự án đồ án tốt nghiệp: Hệ thống điểm danh sinh viên sử dụng công nghệ nhận diện khuôn mặt (AI).

## 📂 Cấu trúc dự án

- `/BE`: Backend (Spring Boot, Java 17, MySQL)
- `/FE`: Frontend (React, Vite, Tailwind CSS)
- `/AI`: Module nhận diện khuôn mặt (Python, FastAPI, Face Recognition)

---

## 🛠 Hướng dẫn cài đặt & Chạy Local

### 1. Yêu cầu hệ thống
- **Java 17** hoặc mới hơn.
- **Node.js** (LTS khuyến nghị).
- **Python 3.8+**.
- **MySQL Server**.

### 2. Thiết lập Cơ sở dữ liệu
1. Tạo một database mới trong MySQL tên là `attendance_db`.
2. Chạy script khởi tạo dữ liệu mẫu tại: `BE/seed_data.sql`.

### 3. Chạy Backend (Spring Boot)
1. Truy cập vào thư mục `BE`.
2. Kiểm tra cấu hình database trong `src/main/resources/application.properties` (username/password).
3. Chạy lệnh:
   ```bash
   ./mvnw spring-boot:run
   ```
   *(Hoặc chạy trực tiếp từ IDE như IntelliJ/Eclipse)*.
   Backend sẽ chạy tại: `http://localhost:8080`

### 4. Chạy Frontend (React)
1. Truy cập vào thư mục `FE`.
2. Cài đặt dependencies:
   ```bash
   npm install
   ```
3. Chạy server phát triển:
   ```bash
   npm run dev
   ```
   Frontend sẽ chạy tại: `http://localhost:5173`

### 5. Chạy AI Module (FastAPI)
1. Truy cập vào thư mục `AI`.
2. Tạo môi trường ảo (khuyến nghị):
   ```bash
   python -m venv venv
   source venv/bin/activate  # Trên Windows: venv\Scripts\activate
   ```
3. Cài đặt các thư viện:
   ```bash
   pip install -r requirements.txt
   ```
4. Chạy service:
   ```bash
   python main.py
   ```
   AI Service sẽ chạy tại: `http://localhost:8001`

---

## 🔐 Tài khoản đăng nhập mẫu
- **Admin**: `admin` / `admin`
- **Giáo viên**: `teacher` / `teacher`
- **Học sinh**: `HS001` / (Mật khẩu bất kỳ)

## 📝 Lưu ý khi đẩy lên GitHub
- File `.gitignore` đã được cấu hình để loại bỏ các thư mục rác (`node_modules`, `target`, `venv`).
- Đảm bảo bạn không commit các thông tin nhạy cảm (như mật khẩu DB thật) nếu đẩy lên repo public.
