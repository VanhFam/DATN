package com.attendance.backend.controller;

import com.attendance.backend.entity.AttendanceRecord;
import com.attendance.backend.entity.Schedule;
import com.attendance.backend.entity.Student;
import com.attendance.backend.repository.AttendanceRecordRepository;
import com.attendance.backend.repository.ScheduleRepository;
import com.attendance.backend.repository.StudentRepository;
import com.attendance.backend.service.FaceRecognitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/attendance/face")
public class FaceAttendanceController {

    @Autowired
    private FaceRecognitionService faceRecognitionService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    /**
     * Endpoint dành cho App riêng gửi ảnh về để điểm danh.
     * Tự động xác định tiết học đang diễn ra và tính toán Muộn (Late)
     */
    @PostMapping("/check")
    @Transactional
    public ResponseEntity<?> checkFace(
            @RequestParam("image") MultipartFile image,
            @RequestParam("studentId") String studentId,
            @RequestParam("classId") String classId
    ) {
        try {
            // 1. Tìm thông tin học sinh
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (studentOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy học sinh"));
            }

            Student student = studentOpt.get();
            if (!student.getClassId().equals(classId)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Học sinh không thuộc lớp " + classId));
            }

            String storedEmbedding = student.getFaceEmbedding();
            if (storedEmbedding == null || storedEmbedding.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Học sinh chưa có dữ liệu khuôn mặt mẫu"));
            }

            // 2. Gọi AI Service để verify (có xử lý lỗi kết nối)
            Map<String, Object> aiResult;
            try {
                aiResult = faceRecognitionService.verifyFace(image, storedEmbedding);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of("message", "Dịch vụ nhận diện khuôn mặt đang bận hoặc gặp lỗi kết nối", "error", e.getMessage()));
            }

            boolean matched = (boolean) aiResult.getOrDefault("match", false);
            if (!matched) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Khuôn mặt không khớp",
                    "confidence", aiResult.get("confidence")
                ));
            }

            // 3. Xác định lịch học (Schedules) hiện tại
            LocalTime now = LocalTime.now();
            LocalDate today = LocalDate.now();
            String dayOfWeekVN = getVietnameseDayOfWeek(today.getDayOfWeek().getValue());
            
            List<Schedule> todaySchedules = scheduleRepository.findByClassIdAndDayOfWeek(classId, dayOfWeekVN);
            Schedule activeSchedule = null;

            // Tìm tiết học đang diễn ra hoặc sắp bắt đầu (trong vòng 30p trước và trong lúc học)
            for (Schedule s : todaySchedules) {
                LocalTime start = LocalTime.parse(s.getStartTime());
                LocalTime end = LocalTime.parse(s.getEndTime());
                
                // Cho phép điểm danh từ 30p trước giờ bắt đầu đến trước giờ kết thúc
                if (now.isAfter(start.minusMinutes(30)) && now.isBefore(end)) {
                    activeSchedule = s;
                    break;
                }
            }

            if (activeSchedule == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Hiện tại không có lịch học nào của lớp " + classId));
            }

            // 4. Tính toán trạng thái (Muộn nếu sau giờ bắt đầu 15 phút)
            LocalTime startTime = LocalTime.parse(activeSchedule.getStartTime());
            AttendanceRecord.AttendanceStatus status = AttendanceRecord.AttendanceStatus.present;
            if (now.isAfter(startTime.plusMinutes(15))) {
                status = AttendanceRecord.AttendanceStatus.late;
            }

            // 5. Lưu kết quả điểm danh
            Optional<AttendanceRecord> existing = attendanceRepository
                    .findByStudentIdAndDateAndClassIdAndScheduleId(studentId, today, classId, activeSchedule.getId());
            
            AttendanceRecord record;
            if (existing.isPresent()) {
                record = existing.get();
                // Nếu đã điểm danh rồi thì chỉ cập nhật nếu trạng thái mới tốt hơn (ví dụ từ vắng sang có mặt)
                // Hoặc ghi đè tùy logic, ở đây ta ghi đè giờ check-in mới nhất.
            } else {
                record = AttendanceRecord.builder()
                        .studentId(studentId)
                        .studentName(student.getName())
                        .classId(classId)
                        .date(today)
                        .scheduleId(activeSchedule.getId())
                        .method(AttendanceRecord.Method.FACE_ID)
                        .build();
            }

            record.setStatus(status);
            record.setCheckInTime(now);
            if (status == AttendanceRecord.AttendanceStatus.late) {
                record.setNote("Đi muộn qua FaceID lúc " + now);
            }
            
            attendanceRepository.save(record);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", status == AttendanceRecord.AttendanceStatus.late ? "Điểm danh MUỘN thành công" : "Điểm danh thành công",
                "studentName", student.getName(),
                "subject", activeSchedule.getSubject(),
                "status", status.name(),
                "confidence", aiResult.get("confidence")
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi xử lý hệ thống", "error", e.getMessage()));
        }
    }

    private String getVietnameseDayOfWeek(int dayVal) {
        // LocalDate dayVal: 1 (Mon) -> 7 (Sun)
        if (dayVal == 7) return "Chủ Nhật";
        return "Thứ " + (dayVal + 1);
    }

    /**
     * Endpoint để Admin/Giáo viên cập nhật ảnh mẫu cho học sinh
     */
    @PostMapping("/register-face/{studentId}")
    @Transactional
    public ResponseEntity<?> registerFace(
            @PathVariable String studentId,
            @RequestParam("image") MultipartFile image
    ) {
        try {
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (studentOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy học sinh");

            String embedding = faceRecognitionService.getFaceEmbedding(image);
            
            Student student = studentOpt.get();
            student.setFaceEmbedding(embedding);
            studentRepository.save(student);

            return ResponseEntity.ok("Cập nhật dữ liệu khuôn mặt thành công");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}
