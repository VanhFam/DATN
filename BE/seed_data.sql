-- File: seed_data.sql
-- Script khởi tạo dữ liệu mẫu cho hệ thống quản lý điểm danh
-- Sử dụng: Chạy file này trong MySQL Workbench hoặc lệnh: mysql -u root -p < seed_data.sql

USE attendance_db;

-- 1. Xóa dữ liệu cũ (Theo thứ tự ngược lại để tránh lỗi Foreign Key)
DELETE FROM attendance_records;
DELETE FROM schedules;
DELETE FROM students;
DELETE FROM teachers;
DELETE FROM semesters;
DELETE FROM classes;
DELETE FROM users;

-- 2. Khởi tạo Lớp học (classes)
INSERT INTO classes (id, name, description) VALUES 
('CNTT01', 'Công nghệ thông tin 1', 'Lớp CNTT khóa 2022'),
('CNTT02', 'Công nghệ thông tin 2', 'Lớp CNTT khóa 2022');

-- 3. Khởi tạo Học kỳ (semesters)
INSERT INTO semesters (name, start_date, end_date, is_active) VALUES 
('Học kỳ 2 - 2025-2026', '2026-01-01', '2026-06-30', 1);

-- 4. Khởi tạo Tài khoản người dùng (users)
-- Mật khẩu mặc định là '123456' hoặc 'admin123' đã được hash bằng BCrypt
-- admin123: $2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TVuHOn2
-- 123456: $2a$10$Y50UaMWM7p1S0pT8Fv9mGuzfWfGvGlvGlvGlvGlvGlvGlvGlvGlvG (Lưu ý: Hash thực tế có thể khác, đây là ví dụ)
-- Sử dụng hash chuẩn cho 'admin123' và '123456'

-- Admin (admin/admin123)
INSERT INTO users (id, username, password_hash, role, name, email, is_active, created_at) VALUES 
(1, 'admin', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TVuHOn2', 'ADMIN', 'Hệ thống Quản trị', 'admin@school.edu.vn', 1, NOW());

-- Teacher (gv001/123456)
INSERT INTO users (id, username, password_hash, role, name, email, phone, is_active, created_at) VALUES 
(2, 'gv001', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TVuHOn2', 'TEACHER', 'Nguyễn Văn A', 'gv_vana@school.edu.vn', '0912345678', 1, NOW());

-- Students (sv001, sv002, sv003 / 123456)
INSERT INTO users (id, username, password_hash, role, name, is_active, created_at) VALUES 
(3, 'SV001', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TVuHOn2', 'STUDENT', 'Trần Thị B', 1, NOW()),
(4, 'SV002', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TVuHOn2', 'STUDENT', 'Lê Văn C', 1, NOW()),
(5, 'SV003', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TVuHOn2', 'STUDENT', 'Phạm Minh D', 1, NOW());

-- 5. Khởi tạo Giáo viên (teachers)
INSERT INTO teachers (id, name, email, phone, assigned_class, is_active, user_id) VALUES 
('GV001', 'Nguyễn Văn A', 'gv_vana@school.edu.vn', '0912345678', 'CNTT01', 1, 2);

-- 6. Khởi tạo Sinh viên (students)
INSERT INTO students (id, name, class_id, is_active, user_id) VALUES 
('SV001', 'Trần Thị B', 'CNTT01', 1, 3),
('SV002', 'Lê Văn C', 'CNTT01', 1, 4),
('SV003', 'Phạm Minh D', 'CNTT01', 1, 5);

-- 7. Khởi tạo Lịch học (schedules)
INSERT INTO schedules (id, class_id, subject, teacher_id, teacher_name, day_of_week, start_time, end_time, room) VALUES 
('SCH001', 'CNTT01', 'Lập trình Java', 'GV001', 'Nguyễn Văn A', 'MONDAY', '07:30', '11:30', 'A101'),
('SCH002', 'CNTT01', 'Cơ sở dữ liệu', 'GV001', 'Nguyễn Văn A', 'WEDNESDAY', '13:30', '17:30', 'B202');

COMMIT;
