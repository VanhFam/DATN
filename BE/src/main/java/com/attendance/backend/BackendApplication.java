package com.attendance.backend;

import com.attendance.backend.entity.*;
import com.attendance.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    @Transactional
    public CommandLineRunner initData(
            UserRepository userRepository,
            StudentRepository studentRepository,
            TeacherRepository teacherRepository,
            ClassRoomRepository classRoomRepository,
            ScheduleRepository scheduleRepository,
            SemesterRepository semesterRepository,
            PasswordEncoder passwordEncoder,
            jakarta.persistence.EntityManager entityManager,
            org.springframework.transaction.PlatformTransactionManager transactionManager) {
        return args -> {
            org.springframework.transaction.support.TransactionTemplate transactionTemplate = 
                new org.springframework.transaction.support.TransactionTemplate(transactionManager);

            transactionTemplate.execute(status -> {
                try {
                    System.out.println(">>> [DEBUG] Kiểm tra dữ liệu hệ thống...");
                    long userCount = userRepository.count();
                    long studentCount = studentRepository.count();
                    long classCount = classRoomRepository.count();
                    System.out.println(">>> [DEBUG] Hiện có: " + userCount + " Users, " + studentCount + " Students, " + classCount + " Classes");

                    // Migration: Chuyển dữ liệu từ cột class_id cũ sang bảng trung gian student_classes mới
                    try {
                        String migrationSql = "INSERT INTO student_classes (student_id, class_id) " +
                                             "SELECT id, class_id FROM students " +
                                             "WHERE class_id IS NOT NULL AND class_id != '' " +
                                             "AND id NOT IN (SELECT student_id FROM student_classes)";
                        
                        int rows = entityManager.createNativeQuery(migrationSql).executeUpdate();
                        if (rows > 0) {
                            System.out.println(">>> [MIGRATION] Đã di chuyển " + rows + " bản ghi sang cấu trúc mới!");
                        }
                    } catch (Exception e) {
                        // Bỏ qua nếu cột cũ không tồn tại
                    }

                    // 1. Tạo Admin nếu chưa có
                    if (userRepository.findByUsername("admin").isEmpty()) {
                        System.out.println(">>> [INIT] Tạo tài khoản Admin mặc định...");
                        userRepository.save(User.builder()
                                .username("admin")
                                .passwordHash(passwordEncoder.encode("admin123"))
                                .role(User.Role.ADMIN)
                                .name("Hệ thống Quản trị")
                                .email("admin@school.edu.vn")
                                .isActive(true)
                                .build());
                    }

                    // 2. Tạo Lớp học nếu chưa có
                    if (classRoomRepository.count() == 0) {
                        System.out.println(">>> [INIT] Tạo môn học mẫu...");
                        classRoomRepository.save(new ClassRoom("CNTT01", "Công nghệ thông tin 1", "Khóa 2022", 50));
                        classRoomRepository.save(new ClassRoom("CNTT02", "Công nghệ thông tin 2", "Khóa 2022", 50));
                    }

                    // 3. Tạo Học kỳ nếu chưa có
                    if (semesterRepository.count() == 0) {
                        semesterRepository.save(Semester.builder()
                                .name("Học kỳ 2 - 2025-2026")
                                .startDate(LocalDate.of(2026, 1, 1))
                                .endDate(LocalDate.of(2026, 6, 30))
                                .isActive(true)
                                .build());
                    }

                    // 4. Tạo Giáo viên nếu chưa có
                    if (teacherRepository.count() == 0) {
                        User teacherUser = userRepository.findByUsername("gv001").orElseGet(() -> 
                            userRepository.save(User.builder()
                                .username("gv001")
                                .passwordHash(passwordEncoder.encode("admin123"))
                                .role(User.Role.TEACHER)
                                .name("Nguyễn Văn A")
                                .email("gv_vana@school.edu.vn")
                                .isActive(true)
                                .build())
                        );
                        
                        teacherRepository.save(Teacher.builder()
                                .id("GV001")
                                .name("Nguyễn Văn A")
                                .email("gv_vana@school.edu.vn")
                                .userId(teacherUser.getId())
                                .build());
                    }

                    // 5. Tạo Sinh viên nếu chưa có
                    if (studentRepository.count() == 0) {
                        System.out.println(">>> [INIT] Tạo sinh viên mẫu...");
                        String[] names = {"Nguyễn Thị B", "Trần Văn C", "Lê Minh D"};
                        for (int i = 1; i <= 3; i++) {
                            String svId = "SV00" + i;
                            final int idx = i - 1;
                            User svUser = userRepository.findByUsername(svId).orElseGet(() -> 
                                userRepository.save(User.builder()
                                    .username(svId)
                                    .passwordHash(passwordEncoder.encode("admin123"))
                                    .role(User.Role.STUDENT)
                                    .name(names[idx])
                                    .isActive(true)
                                    .build())
                            );
                            
                            Student student = Student.builder()
                                    .id(svId)
                                    .name(names[idx])
                                    .userId(svUser.getId())
                                    .build();
                            
                            classRoomRepository.findById("CNTT01").ifPresent(c -> student.getClasses().add(c));
                            studentRepository.save(student);
                        }
                    }

                    // 6. Tạo Lịch học nếu chưa có
                    if (scheduleRepository.count() == 0) {
                        scheduleRepository.save(Schedule.builder()
                                .id("SCH001")
                                .classId("CNTT01")
                                .subject("Lập trình Java")
                                .teacherId("GV001")
                                .teacherName("Nguyễn Văn A")
                                .dayOfWeek("Thứ 2")
                                .startTime("07:30")
                                .endTime("11:30")
                                .room("A101")
                                .build());
                    }

                    // 7. Cập nhật dữ liệu cũ (Migration từ Tiếng Anh sang Tiếng Việt)
                    entityManager.createNativeQuery("UPDATE schedules SET day_of_week = 'Thứ 2' WHERE day_of_week = 'MONDAY'").executeUpdate();
                    entityManager.createNativeQuery("UPDATE schedules SET day_of_week = 'Thứ 3' WHERE day_of_week = 'TUESDAY'").executeUpdate();
                    entityManager.createNativeQuery("UPDATE schedules SET day_of_week = 'Thứ 4' WHERE day_of_week = 'WEDNESDAY'").executeUpdate();
                    entityManager.createNativeQuery("UPDATE schedules SET day_of_week = 'Thứ 5' WHERE day_of_week = 'THURSDAY'").executeUpdate();
                    entityManager.createNativeQuery("UPDATE schedules SET day_of_week = 'Thứ 6' WHERE day_of_week = 'FRIDAY'").executeUpdate();
                    entityManager.createNativeQuery("UPDATE schedules SET day_of_week = 'Thứ 7' WHERE day_of_week = 'SATURDAY'").executeUpdate();
                    entityManager.createNativeQuery("UPDATE schedules SET day_of_week = 'Chủ Nhật' WHERE day_of_week = 'SUNDAY'").executeUpdate();

                    System.out.println(">>> [DEBUG] Kiểm tra dữ liệu hoàn tất!");
                    return null;
                } catch (Exception e) {
                    System.err.println(">>> [ERROR] Lỗi khởi tạo dữ liệu: " + e.getMessage());
                    return null;
                }
            });

            // Đảm bảo admin luôn được active
            userRepository.findByUsername("admin").ifPresent(admin -> {
                if (!admin.getIsActive()) {
                    admin.setIsActive(true);
                    userRepository.save(admin);
                }
            });
        };
    }
}
