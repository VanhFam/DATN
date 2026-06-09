# Hệ Thống Điểm Danh Thông Minh (Attendance AI)

Dự án đồ án tốt nghiệp: Hệ thống điểm danh sinh viên sử dụng công nghệ nhận diện khuôn mặt (AI), định vị GPS và ứng dụng di động.

## 📂 Cấu trúc dự án

- `/BE`: Backend (Spring Boot 3.2, Java 17, MySQL) - Chạy tại cổng `8002`
- `/App`: Mobile App dành cho Sinh viên (Android SDK, Java)
- `/AIFacePython`: Module nhận diện khuôn mặt (Python 3.9+, Flask, Face Recognition) - Chạy tại cổng `5000`
- `/FE`: Giao diện Quản trị Web (React, Vite, Tailwind CSS) - Chạy tại cổng `5173`

---

## 🛠 Hướng dẫn cài đặt & Chạy Local

### 1. Yêu cầu hệ thống
- **Java 17** (JDK).
- **Android Studio** (để chạy App).
- **Python 3.9+**.
- **Node.js** (LTS).
- **MySQL Server 8.0+**.

### 2. Thiết lập Cơ sở dữ liệu
1. Tạo một database trong MySQL tên là `attendance_db`.
2. Cấu hình username/password trong `BE/src/main/resources/application.properties`.
3. Khi chạy lần đầu, Hibernate sẽ tự động tạo bảng (`ddl-auto=update`).

### 3. Chạy AI Module (Python)
1. Truy cập vào `AIFacePython/face-service`.
2. Tạo môi trường ảo và cài đặt thư viện:
   ```bash
   pip install -r requirements.txt
   ```
3. Chạy service:
   ```bash
   python app.py
   ```
   AI Service mặc định chạy tại: `http://localhost:5000`

### 4. Chạy Backend (Spring Boot)
1. Mở thư mục `BE` bằng IntelliJ IDEA hoặc dùng lệnh:
   ```bash
   mvn spring-boot:run
   ```
   API Server chạy tại: `http://localhost:8002/api`

### 5. Chạy Mobile App (Android)
1. Mở thư mục `App` bằng Android Studio.
2. Đợi Gradle đồng bộ xong.
3. Chạy trên máy ảo (Emulator) hoặc thiết bị thật.
   *Lưu ý: Nếu chạy trên máy ảo, BASE_URL trong `RetrofitClient` nên để `http://10.0.2.2:8002/api/`.*

### 6. Chạy Web Admin (React)
1. Truy cập vào `FE`.
2. Cài đặt và chạy:
   ```bash
   npm install
   npm run dev
   ```

---

## 🔐 Tài khoản đăng nhập mẫu
- **Admin**: `admin` / `admin`

## 📝 Lưu ý
- Đảm bảo AI Service và Backend đều đang chạy trước khi thực hiện điểm danh trên App.
- Ứng dụng Android yêu cầu quyền **Camera** và **Vị trí (GPS)** để hoạt động.
