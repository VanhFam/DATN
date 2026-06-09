# BÁO CÁO HỆ THỐNG QUẢN LÝ ĐIỂM DANH AI
## Chức Năng, Kiến Trúc & Luồng Hoạt Động

---

**Tên dự án:** Attendance AI - HỆ THỐNG ĐIỂM DANH VÀ QUẢN LÝ SINH VIÊN ỨNG DỤNG NHẬN DẠNG KHUÔN MẶT  
**Công nghệ:** Spring Boot · React · Python FastAPI · Android  
**Cơ sở dữ liệu:** MySQL  
**Phiên bản tài liệu:** 1.0  
**Ngày cập nhật:** 08/05/2026  

---

## I. TỔNG QUAN HỆ THỐNG

Hệ thống Attendance AI là một nền tảng quản lý điểm danh tích hợp nhiều công nghệ hiện đại, bao gồm:

- **Nhận diện khuôn mặt (Face Recognition)** sử dụng mô hình AI để xác thực danh tính sinh viên.
- **Định vị GPS (Geofencing)** để đảm bảo sinh viên điểm danh đúng địa điểm.
- **Quản lý toàn diện** dành cho Quản trị viên qua giao diện Web React.
- **Ứng dụng di động Android** dành cho sinh viên để tự điểm danh.

### Các thành phần chính:

| Thành phần | Công nghệ | Cổng | Vai trò |
|---|---|---|---|
| **Frontend (FE)** | React + Vite + TailwindCSS | :5173 | Giao diện Quản trị Web |
| **Backend (BE)** | Spring Boot 3.2 + JPA | :8002 | API Server, xử lý nghiệp vụ |
| **AI Service** | Python Flask + face_recognition | :5000 | Nhận diện khuôn mặt |
| **Mobile App** | Android (Kotlin/Java) | - | App sinh viên tự điểm danh |
| **Database** | MySQL | :3306 | Lưu trữ dữ liệu |

---

## II. KIẾN TRÚC HỆ THỐNG

```
┌─────────────────┐    ┌─────────────────┐
│   Quản trị viên │    │    Giáo viên    │
│  (Web Browser)  │    │  (Web Browser)  │
└────────┬────────┘    └────────┬────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────┐
│         Frontend (React - Port 5173)    │
│  Dashboard │ Students │ Teachers │ ...  │
└──────────────────┬──────────────────────┘
                   │ REST API (HTTP/JSON)
                   ▼
┌─────────────────────────────────────────┐
│      Backend (Spring Boot - Port 8002)  │
│  /api/students │ /api/teachers │ ...    │
│         JWT Authentication              │
└──────┬──────────────┬───────────────────┘
       │              │
       ▼              ▼
┌──────────┐  ┌───────────────────────────┐
│  MySQL   │  │  AI Service (Flask:5000)  │
│ Database │  │ /face/register│/face/verify│
└──────────┘  └───────────────────────────┘
                          ▲
                          │ HTTP
┌─────────────────────────┘
│   Android App (Sinh viên)
│   Camera → Chụp ảnh → Gửi lên BE → BE gọi AI
└─────────────────────────────────────────
```

---

## III. LUỒNG XÁC THỰC & PHÂN QUYỀN

### 3.1. Luồng Đăng Nhập

```
[Người dùng nhập Username + Password]
           │
           ▼
[POST /api/auth/login]
           │
           ▼
[BE: Kiểm tra DB, so sánh BCrypt hash]
           │
     ┌─────┴─────┐
  Sai mật khẩu  Đúng
     │             │
     ▼             ▼
  Trả lỗi    [Tạo JWT Token (24h)]
              [Trả về: token + role]
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
     ADMIN      TEACHER    STUDENT
   (Web FE)    (Web FE)   (Android)
```

### 3.2. Phân quyền truy cập

| Chức năng | Admin | Giáo viên | Sinh viên |
|---|:---:|:---:|:---:|
| Quản lý học sinh | ✅ CRUD |  Xem | ❌ |
| Quản lý giáo viên | ✅ CRUD | ❌ | ❌ |
| Quản lý học phần | ✅ CRUD |  Xem | ❌ |
| Tạo/Xóa lịch dạy | ✅ | ❌ | ❌ |
| Điểm danh thủ công | ✅ | ✅ | ❌ |
| Xem báo cáo | ✅ | ✅ (lớp mình) | ❌ |
| Tự điểm danh (App) | ❌ | ❌ | ✅ |

---

## IV. CÁC MODULE CHÍNH VÀ LUỒNG HOẠT ĐỘNG

### 4.1. Quản Lý Học Sinh (Students)

**Frontend:** `FE/src/pages/Students.jsx`  
**Backend API:** `POST/GET/PUT/DELETE /api/students`  
**Service:** `StudentService.java`

**Chức năng:**
- Thêm, sửa, xóa thông tin học sinh
- Gán học sinh vào các học phần (ClassRoom)
- Tìm kiếm, lọc theo tên, mã học sinh, học phần
- Export danh sách ra PDF và Excel (tự động căn chỉnh độ rộng cột)
- **Import Excel hàng loạt** (`POST /api/students/bulk`)

**Validate khi thêm/sửa:**
- Mã học sinh không được trùng
- Email không được trùng với học sinh khác
- Số điện thoại không được trùng với học sinh khác

**Luồng tạo học sinh:**
```
[Admin điền form / Upload file Excel]
           │
           ▼
[FE: Validate dữ liệu cơ bản]
           │
           ▼
[POST /api/students  hoặc  /api/students/bulk]
           │
           ▼
[BE: StudentService.createStudent()]
    ├── Kiểm tra trùng Mã, Email, SĐT
    ├── Tạo User account (username=MãHS, password=MãHS, role=STUDENT)
    └── Tạo Student record, gán lớp học
           │
           ▼
[Lưu vào MySQL: bảng users + students + student_classes]
```

---

### 4.2. Quản Lý Giáo Viên (Teachers)

**Frontend:** `FE/src/pages/Teachers.jsx`  
**Backend API:** `POST/GET/PUT/DELETE /api/teachers`  
**Service:** `TeacherService.java`

**Chức năng:**
- Thêm, sửa, xóa thông tin giáo viên
- Hiển thị giới tính với nhãn màu sắc (Xanh/Hồng)
- Import Excel hàng loạt (`POST /api/teachers/bulk`)

**Validate:**
- Mã GV không được trùng
- Email và Số điện thoại không được trùng trong hệ thống

**Luồng tạo giáo viên:**
```
[Admin điền form]
      │
      ▼
[POST /api/teachers]
      │
      ▼
[BE: Tạo User (role=TEACHER) + Teacher record]
      │
      ▼
[MySQL: bảng users + teachers]
```

---

### 4.3. Quản Lý Học Phần / Lớp Học (Classes)

**Frontend:** `FE/src/pages/Classes.jsx`  
**Backend API:** `POST/GET/PUT/DELETE /api/classes`  
**Service:** `ClassRoomService.java`

**Chức năng:**
- Tạo, sửa, xóa học phần
- Quản lý sĩ số (danh sách sinh viên đăng ký)
- Xem mô tả chi tiết qua popup (không bị cắt chữ)
- Import Excel hàng loạt (`POST /api/classes/bulk`)
- Hiển thị thanh tiến trình sĩ số (đỏ khi đầy)

**Validate:**
- Mã môn học không được trùng
- Tên môn không được trùng

---

### 4.4. Quản Lý Lịch Học & Lịch Dạy (Schedules)

**Frontend Web:** `FE/src/pages/Schedules.jsx`  
**Mobile App:** `ScheduleFragment.java`  
**Backend API:** `GET /api/schedules` & `GET /api/students/me/schedules`

**Chức năng nâng cao trên Mobile:**
- **Phân nhóm theo ngày:** Tự động chia lịch học theo các thứ trong tuần (Thứ 2 → Chủ Nhật).
- **Sắp xếp theo giờ:** Trong cùng một ngày, các môn học được xếp thứ tự theo thời gian bắt đầu.
- **Giao diện thẻ (Card):** Mỗi môn học hiển thị đầy đủ tên môn, thời gian, và phòng học với thiết kế hiện đại.

---

### 4.5. Điểm Danh (Attendance)

**Mobile App:** `AttendanceActivity.java`  
**Backend API:** `GET /api/students/me/schedules/available`

#### Luồng điểm danh tự động trên App SV:
1. **Lọc môn học:** App chỉ hiển thị duy nhất môn học đang trong khung giờ được phép điểm danh.
2. **Chụp ảnh:** Sinh viên chụp ảnh khuôn mặt qua camera trước.
3. **Xác thực:** Gửi ảnh và tọa độ GPS về server để kiểm tra chéo với dữ liệu gốc.
4. **Kết quả:** Hiển thị thông báo thành công hoặc lý do thất bại (sai khuôn mặt, sai vị trí, hết giờ).

---

### 4.6. Điểm Danh Bằng Khuôn Mặt (Face Recognition)

**Backend API:** `/api/face-attendance/*`  
**Controller:** `FaceAttendanceController.java`  
**AI Service:** `AIFacePython/face-service/app.py` (Python Flask - Port 5000)

#### Bước 1: Đăng ký khuôn mặt (Một lần)
```
[Sinh viên chụp ảnh trên App Android]
           │
           ▼
[POST /api/students/me/face]  (Gửi ảnh base64)
           │
           ▼
[BE gọi AI Service: POST http://localhost:5000/face/register]
           │
           ▼
[AI trả về: vector embedding 128 chiều]
           │
           ▼
[BE lưu embedding vào DB (cột face_embedding)]
```

#### Bước 2: Điểm danh bằng khuôn mặt
```
[SV chọn lớp đang mở → Chụp ảnh khuôn mặt]
           │
           ▼
[POST /api/face-attendance/check-in]
    (Gửi: classId + scheduleId + ảnh base64 + tọa độ GPS)
           │
           ▼
[BE: Kiểm tra thời gian (còn trong khung cho phép?)]
           │
           ▼
[BE: Gọi AI /face/verify — so sánh ảnh hiện tại với embedding đã lưu]
           │
     ┌─────┴──────┐
   Không khớp   Khớp (distance < 0.5)
     │               │
   Từ chối        [Kiểm tra GPS]
                      │
              ┌───────┴───────┐
          Ngoài bán kính   Trong bán kính
              │                 │
           Từ chối         Ghi nhận điểm danh
                           (present / late)
```

---

### 4.7. Vị Trí GPS (Locations)

**Frontend:** `FE/src/pages/Locations.jsx`  
**Backend API:** `/api/locations`  
**Service:** `LocationService.java`

**Chức năng:**
- Quản lý danh sách vị trí (tên, địa chỉ, vĩ độ, kinh độ, bán kính)
- Tìm kiếm địa chỉ tự động qua Nominatim OpenStreetMap API
- Lấy tọa độ hiện tại từ GPS trình duyệt
- Gán vị trí vào từng lịch dạy cụ thể

**Công thức kiểm tra Geofencing (Haversine):**
```
Khoảng cách = 2 * R * arcsin(sqrt(
    sin²((lat2-lat1)/2) +
    cos(lat1) * cos(lat2) * sin²((lon2-lon1)/2)
))

Nếu khoảng_cách > bán_kính → Từ chối điểm danh
```

---

### 4.8. Báo Cáo & Thống Kê (Reports)

**Frontend:** `FE/src/pages/Reports.jsx`  
**Backend API:** `/api/dashboard/*`

**Các loại báo cáo:**

| Loại | Mô tả | Export |
|---|---|---|
| Điểm danh ngày | Danh sách trạng thái từng SV trong 1 buổi | Excel (auto-size) |
| Tổng hợp học kỳ | Tổng hợp có mặt/vắng/muộn/nửa buổi | Excel (auto-size) |
| Chi tiết phạm vi | Ma trận ngày × học sinh | Excel (auto-size) |
| Danh sách học sinh | Xuất danh sách SV của 1 lớp | PDF + Excel |

**Công thức tỷ lệ chuyên cần:**
```
% Chuyên cần = (Có mặt + Muộn + 0.5 × Nửa buổi) / Tổng số buổi × 100
```

**Cảnh báo tự động:**
- 🟡 **Cảnh báo vàng**: Tỷ lệ vắng > 15%
- 🔴 **Cảnh báo đỏ**: Tỷ lệ vắng > 20%

---

### 4.9. Tổng Quan (Dashboard)

**Frontend:** `FE/src/pages/Dashboard.jsx`  
**Backend API:** `/api/dashboard/*`

**Hiển thị:**
- Tổng số học sinh trong hệ thống
- Tổng số lớp học đang hoạt động
- Số học sinh có mặt hôm nay
- Số học sinh vắng & muộn hôm nay
- Biểu đồ tỷ lệ điểm danh 7 ngày qua
- Danh sách hoạt động điểm danh mới nhất (LIVE)

---

### 4.10. Cài Đặt Hệ Thống (Settings)

**Frontend:** `FE/src/pages/Settings.jsx`  
**Backend API:** `/api/system-settings`, `/api/users`

**Chức năng:**
- Cài đặt cấu hình học kỳ
- Quản lý tài khoản người dùng (đổi mật khẩu, phân quyền)
- Xem thông tin cá nhân
- Cài đặt thông số điểm danh (thời gian muộn, thời gian đóng cửa, ...)

---

## V. TÍNH NĂNG IMPORT/EXPORT EXCEL

### Import Excel hàng loạt

Hỗ trợ 3 module: **Học sinh**, **Giáo viên**, **Học phần**

| Module | Tên cột trong Excel | Mapping DTO |
|---|---|---|
| Học sinh | Mã HS, Họ tên, Học phần, Giới tính, Ngày sinh, Điện thoại, Email | id, name, classId, gender, dob, phone, email |
| Giáo viên | Mã GV, Họ và tên, Email, Số điện thoại, Giới tính | id, name, email, phone, gender |
| Học phần | Mã môn, Tên môn, Sĩ số, Mô tả | id, name, maxStudents, description |

**Luồng Import:**
```
[Admin chọn file .xlsx / .xls]
           │
           ▼
[FE: excelImport.js đọc file (XLSX library)]
    ├── cellDates: true (xử lý ngày tháng đúng định dạng)
    ├── raw: false (chuyển số thành chuỗi)
    └── Ánh xạ tên cột → field DTO
           │
           ▼
[POST /api/{students|teachers|classes}/bulk]
           │
           ▼
[BE: Validate từng record (trùng ID, Email, SĐT)]
    ├── Nếu lỗi → Throw exception với thông báo rõ ràng
    └── Nếu OK → Lưu hàng loạt
```

### Export Excel với Auto-Column Size

Hàm `getAutoColumnWidths(data)` tự động tính toán độ rộng tối ưu cho từng cột dựa trên nội dung thực tế, cộng thêm 2 ký tự đệm.

---

## VI. ỨNG DỤNG DI ĐỘNG ANDROID (Dành cho Sinh viên)

Ứng dụng được thiết kế theo kiến trúc **Single Activity - Multiple Fragments** với **Navigation Drawer (Sidebar)** giúp trải nghiệm mượt mà và hiện đại.

### 6.1. Cấu trúc Điều hướng (Sidebar Navigation)
- **Trang chủ (Home):** Các phím tắt nhanh (Điểm danh, Đăng ký khuôn mặt, Lịch sử).
- **Lịch học trong tuần:** Xem thời khóa biểu cá nhân được phân nhóm theo ngày.
- **Cài đặt:** Quản lý thông tin cá nhân và tài khoản.
- **Đăng xuất:** Thoát khỏi hệ thống và xóa session JWT.

### 6.2. Tính năng Trọng tâm
1. **Đăng ký/Cập nhật khuôn mặt:** 
   - Chụp ảnh chân dung trực tiếp.
   - Server gọi AI Service để tách đặc trưng (128 vector) và lưu vào DB.
2. **Điểm danh thông minh:**
   - Tự động nhận diện môn học đang diễn ra.
   - Bắt buộc kiểm tra GPS (Geofencing) trong bán kính cho phép của phòng học.
   - Chụp ảnh xác thực khuôn mặt AI (ngăn chặn điểm danh hộ bằng ảnh chụp lại).
3. **Xem lịch học:**
   - Giao diện trực quan, chia theo ngày như bản Web.
   - Hỗ trợ vuốt chạm mượt mà để xem danh sách dài.

---

## VII. BẢO MẬT

| Cơ chế | Mô tả |
|---|---|
| **JWT Token** | Xác thực mọi request, hết hạn sau 24 giờ |
| **BCrypt** | Mã hóa mật khẩu người dùng |
| **Role-Based Access** | ADMIN / TEACHER / STUDENT — chặn truy cập trái phép |
| **CORS** | Chỉ cho phép từ localhost:5173 và localhost:3000 |
| **AI API Key** | AI Service yêu cầu key xác thực riêng |
| **Geofencing** | Xác minh vị trí thực tế chống điểm danh hộ |

---

## VIII. CẤU TRÚC DỮ LIỆU (Database)

**Các bảng chính trong MySQL:**

| Bảng | Mô tả |
|---|---|
| `users` | Tài khoản đăng nhập (username, password, role) |
| `students` | Thông tin học sinh (id, name, gender, dob, phone, email, face_embedding) |
| `teachers` | Thông tin giáo viên (id, name, gender, email, phone) |
| `class_rooms` | Học phần / Môn học (id, name, max_students, description) |
| `student_classes` | Bảng trung gian: Học sinh ↔ Học phần |
| `schedules` | Lịch dạy (class_id, teacher_id, day, start_time, end_time, room, location_id) |
| `attendance_records` | Bản ghi điểm danh (student_id, schedule_id, date, status, check_in_time) |
| `locations` | Vị trí GPS (id, name, lat, lng, radius) |
| `system_settings` | Cài đặt hệ thống (thời gian muộn, thời gian đóng, ...) |
| `semesters` | Học kỳ (id, name, start_date, end_date) |

---

## IX. CÁC API ENDPOINT CHÍNH

### Authentication
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/login` | Đăng nhập, nhận JWT |

### Students
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/students` | Lấy danh sách học sinh |
| POST | `/api/students` | Thêm học sinh mới |
| POST | `/api/students/bulk` | Import hàng loạt từ Excel |
| PUT | `/api/students/{id}` | Cập nhật thông tin |
| DELETE | `/api/students/{id}` | Xóa học sinh |
| POST | `/api/students/me/face` | Đăng ký khuôn mặt (SV) |

### Teachers
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/teachers` | Lấy danh sách giáo viên |
| POST | `/api/teachers` | Thêm giáo viên mới |
| POST | `/api/teachers/bulk` | Import hàng loạt |
| PUT | `/api/teachers/{id}` | Cập nhật thông tin |
| DELETE | `/api/teachers/{id}` | Xóa giáo viên |

### Classes (Học phần)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/classes` | Lấy danh sách học phần |
| POST | `/api/classes` | Tạo học phần mới |
| POST | `/api/classes/bulk` | Import hàng loạt |
| PUT | `/api/classes/{id}` | Cập nhật học phần |
| DELETE | `/api/classes/{id}` | Xóa học phần |

### Schedules (Lịch dạy)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/schedules` | Lấy toàn bộ lịch dạy |
| POST | `/api/schedules` | Tạo lịch dạy (có validate chống trùng) |
| PUT | `/api/schedules/{id}` | Cập nhật lịch (có validate) |
| DELETE | `/api/schedules/{id}` | Xóa lịch dạy |

### Attendance (Điểm danh)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/attendance` | Lấy bản ghi điểm danh |
| POST | `/api/attendance/manual` | Điểm danh thủ công (GV/Admin) |
| POST | `/api/face-attendance/check-in` | Điểm danh khuôn mặt (App SV) |

### Reports & Dashboard
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/dashboard/stats` | Số liệu tổng quan |
| GET | `/api/dashboard/recent-activity` | Hoạt động điểm danh mới nhất |

---

## X. HƯỚNG DẪN KHỞI ĐỘNG

### 1. AI Service (Python)
```bash
cd AIFacePython/face-service/
pip install -r requirements.txt
python app.py
# Chạy tại: http://localhost:5000
```

### 2. Backend (Spring Boot)
```bash
cd BE/
mvn spring-boot:run
# Chạy tại: http://localhost:8002/api
```

### 3. Frontend (React)
```bash
cd FE/
npm install
npm run dev
# Chạy tại: http://localhost:5173
```

### 4. Android App
- Mở thư mục `App/` bằng Android Studio
- Cấu hình BASE_URL trỏ về địa chỉ BE
- Build và chạy trên máy ảo hoặc thiết bị thật

---

*Tài liệu này được tạo tự động dựa trên mã nguồn thực tế của dự án. Mọi thay đổi lớn về tính năng nên được cập nhật vào tài liệu này để đảm bảo tính đồng bộ.*
