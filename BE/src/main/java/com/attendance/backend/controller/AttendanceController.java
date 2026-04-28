package com.attendance.backend.controller;

import com.attendance.backend.dto.AttendanceRecordDTO;
import com.attendance.backend.dto.AttendanceSummaryDTO;
import com.attendance.backend.dto.BulkAttendanceRequest;
import com.attendance.backend.service.AttendanceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final com.attendance.backend.repository.TeacherRepository teacherRepository;
    private final com.attendance.backend.repository.ScheduleRepository scheduleRepository;

    public AttendanceController(AttendanceService attendanceService, 
                                com.attendance.backend.repository.TeacherRepository teacherRepository,
                                com.attendance.backend.repository.ScheduleRepository scheduleRepository) {
        this.attendanceService = attendanceService;
        this.teacherRepository = teacherRepository;
        this.scheduleRepository = scheduleRepository;
    }

    /**
     * GET /api/attendance?classId=...&date=yyyy-MM-dd
     * Lấy danh sách điểm danh theo lớp và ngày
     */
    @GetMapping
    public ResponseEntity<List<AttendanceRecordDTO>> getByClassAndDate(
            @RequestParam String classId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            org.springframework.security.core.Authentication authentication) {
        checkAccess(classId, authentication);
        return ResponseEntity.ok(attendanceService.getByClassAndDate(classId, date));
    }

    /**
     * GET /api/attendance/student/{studentId}?from=...&to=...
     * Lịch sử điểm danh của sinh viên
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AttendanceRecordDTO>> getByStudent(
            @PathVariable String studentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(attendanceService.getByStudentAndDateRange(studentId, from, to));
    }

    /**
     * GET /api/attendance/class/{classId}/report?from=...&to=...
     * Báo cáo điểm danh cả lớp trong khoảng thời gian
     */
    @GetMapping("/class/{classId}/report")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<List<AttendanceRecordDTO>> getClassReport(
            @PathVariable String classId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            org.springframework.security.core.Authentication authentication) {
        
        checkAccess(classId, authentication);
        
        return ResponseEntity.ok(attendanceService.getByClassAndDateRange(classId, from, to));
    }

    /**
     * POST /api/attendance/bulk
     * Điểm danh hàng loạt cho cả lớp
     */
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<List<AttendanceRecordDTO>> bulkSave(
            @RequestBody BulkAttendanceRequest request,
            org.springframework.security.core.Authentication authentication) {
        checkAccess(request.getClassId(), authentication);
        return ResponseEntity.ok(attendanceService.bulkSave(request));
    }

    /**
     * PUT /api/attendance/{id}
     * Sửa 1 bản ghi điểm danh
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<AttendanceRecordDTO> updateRecord(
            @PathVariable Long id,
            @RequestBody AttendanceRecordDTO dto,
            org.springframework.security.core.Authentication authentication) {
        // Có thể cần check kỹ hơn dựa trên bản ghi, nhưng đơn giản nhất là check classId trong DTO nếu có
        if (dto.getClassId() != null) {
            checkAccess(dto.getClassId(), authentication);
        }
        return ResponseEntity.ok(attendanceService.updateRecord(id, dto));
    }

    private void checkAccess(String classId, org.springframework.security.core.Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        
        if (!isAdmin) {
            String teacherId = authentication.getName(); // Username chính là mã giáo viên
            
            // Kiểm tra xem giáo viên có dạy lớp này trong Schedule không
            boolean isAssigned = scheduleRepository.findByTeacherIdIgnoreCase(teacherId).stream()
                    .anyMatch(s -> s.getClassId().equalsIgnoreCase(classId));
            
            if (!isAssigned) {
                throw new RuntimeException("Bạn không được phân công dạy môn học " + classId + ". Vui lòng liên hệ Admin.");
            }
        }
    }

    /**
     * GET /api/attendance/student/{studentId}/summary?from=...&to=...
     * Thống kê tỷ lệ có mặt và cảnh báo chuyên cần
     */
    @GetMapping("/student/{studentId}/summary")
    public ResponseEntity<AttendanceSummaryDTO> getAttendanceSummary(
            @PathVariable String studentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(attendanceService.getAttendanceSummary(studentId, from, to));
    }
}
