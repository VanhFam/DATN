package com.attendance.backend.controller;

import com.attendance.backend.dto.StudentDTO;
import com.attendance.backend.service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.attendance.backend.dto.ApiResponse;
import com.attendance.backend.dto.FaceRequest;
import com.attendance.backend.dto.StudentAttendanceResponse;
import com.attendance.backend.entity.Schedule;
import com.attendance.backend.service.AttendanceService;

@RestController
@RequestMapping("/students")
public class StudentController {

    private final StudentService studentService;
    private final com.attendance.backend.repository.TeacherRepository teacherRepository;
    private final com.attendance.backend.repository.ScheduleRepository scheduleRepository;
    private final com.attendance.backend.repository.SemesterRepository semesterRepository;
    private final AttendanceService attendanceService;

    public StudentController(StudentService studentService,
                             com.attendance.backend.repository.TeacherRepository teacherRepository,
                             com.attendance.backend.repository.ScheduleRepository scheduleRepository,
                             com.attendance.backend.repository.SemesterRepository semesterRepository,
                             AttendanceService attendanceService) {
        this.studentService = studentService;
        this.teacherRepository = teacherRepository;
        this.scheduleRepository = scheduleRepository;
        this.semesterRepository = semesterRepository;
        this.attendanceService = attendanceService;
    }

    @GetMapping
    public ResponseEntity<?> getAll(org.springframework.security.core.Authentication authentication,
                                    @RequestParam(required = false) Integer page,
                                    @RequestParam(required = false) Integer limit,
                                    @RequestParam(required = false, defaultValue = "") String search) {
        boolean wantsPage = page != null || limit != null;
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        boolean isTeacher = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TEACHER") || a.getAuthority().equals("TEACHER"));

        if (!isAdmin && isTeacher) {
            String username = authentication.getName();
            List<String> classIds = scheduleRepository.findByTeacherIdIgnoreCase(username).stream()
                    .map(Schedule::getClassId).distinct().toList();

            // Fallback: thử profile ID nếu không tìm thấy lịch theo username
            if (classIds.isEmpty()) {
                String profileId = teacherRepository.findByUsernameOrId(username)
                        .map(com.attendance.backend.entity.Teacher::getId).orElse(username);
                if (!profileId.equals(username)) {
                    classIds = scheduleRepository.findByTeacherIdIgnoreCase(profileId).stream()
                            .map(Schedule::getClassId).distinct().toList();
                }
            }

            if (classIds.isEmpty()) return ResponseEntity.ok(Collections.emptyList());

            if (wantsPage) {
                return ResponseEntity.ok(studentService.getStudentsByClassesPage(classIds, search, page, limit));
            }

            // Bước 1: tìm qua bảng student_classes (enrollment chính thức)
            List<StudentDTO> teacherStudents = studentService.getStudentsByClasses(classIds);

            // Bước 2: Fallback tìm qua bản ghi điểm danh (cho dữ liệu cũ chưa enroll)
            if (teacherStudents.isEmpty()) {
                teacherStudents = studentService.getStudentsByAttendanceClasses(classIds);
            }

            // Không fallback về toàn bộ SV — trả về danh sách rỗng nếu không tìm thấy
            return ResponseEntity.ok(teacherStudents);
        }

        if (wantsPage) {
            return ResponseEntity.ok(studentService.getStudentsPage(search, page, limit));
        }
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<StudentDTO>> getByClass(@PathVariable String classId) {
        // Bước 1: tìm qua enrollment chính thức (student_classes)
        List<StudentDTO> students = studentService.getStudentsByClass(classId);
        // Bước 2: fallback qua bản ghi điểm danh
        if (students.isEmpty()) {
            students = studentService.getStudentsByAttendanceClasses(List.of(classId));
        }
        // Lớp thực sự rỗng → trả về danh sách rỗng, không trả về tất cả SV
        return ResponseEntity.ok(students);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(studentService.getStudentById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentDTO> create(@RequestBody StudentDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.createStudent(dto));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StudentDTO>> createBulk(@RequestBody List<StudentDTO> dtos) {
        return ResponseEntity.ok(studentService.createStudentsBulk(dtos));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentDTO> update(@PathVariable String id, @RequestBody StudentDTO dto) {
        return ResponseEntity.ok(studentService.updateStudent(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentDTO> toggleActive(@PathVariable String id) {
        return ResponseEntity.ok(studentService.toggleActive(id));
    }

    @PostMapping("/me/face")
    public ResponseEntity<ApiResponse<?>> registerFace(
            @RequestBody FaceRequest request,
            org.springframework.security.core.Authentication authentication) {
        String studentId = authentication.getName();
        studentService.registerFace(studentId, request.getBase64());
        return ResponseEntity.ok(new ApiResponse<>("Đăng ký khuôn mặt thành công", "SUCCESS", "", null));
    }

    @PutMapping("/me/face-update")
    public ResponseEntity<ApiResponse<?>> updateFace(
            @RequestBody FaceRequest request,
            org.springframework.security.core.Authentication authentication) {
        String studentId = authentication.getName();
        studentService.updateFace(studentId, request.getBase64());
        return ResponseEntity.ok(new ApiResponse<>("Cập nhật khuôn mặt thành công", "SUCCESS", "", null));
    }

    @GetMapping("/me/attendance")
    public ResponseEntity<ApiResponse<List<StudentAttendanceResponse>>> getMyAttendance(
            org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Chưa đăng nhập");
        }

        String studentId = authentication.getName();
        List<com.attendance.backend.dto.AttendanceRecordDTO> records = attendanceService.getByStudentAndDateRange(
                studentId, LocalDate.of(2000, 1, 1), LocalDate.of(2100, 1, 1));

        // Batch load schedules by scheduleId
        Set<String> scheduleIds = records.stream()
                .map(com.attendance.backend.dto.AttendanceRecordDTO::getScheduleId)
                .filter(sid -> sid != null && !sid.isBlank())
                .collect(Collectors.toSet());
        Map<String, Schedule> scheduleMap = scheduleRepository.findAllById(scheduleIds).stream()
                .collect(Collectors.toMap(Schedule::getId, s -> s));

        // Fallback: classId -> subject (cho bản ghi thủ công không có scheduleId)
        Set<String> classIds = records.stream()
                .map(com.attendance.backend.dto.AttendanceRecordDTO::getClassId)
                .filter(cid -> cid != null && !cid.isBlank())
                .collect(Collectors.toSet());
        Map<String, String> classSubjectFallback = classIds.stream()
                .collect(Collectors.toMap(
                        cid -> cid,
                        cid -> scheduleRepository.findByClassId(cid).stream()
                                .map(Schedule::getSubject).findFirst().orElse(null),
                        (a, b) -> a
                ));

        List<StudentAttendanceResponse> responseList = records.stream().map(r -> {
            StudentAttendanceResponse res = new StudentAttendanceResponse();
            res.setClassName(r.getClassId());
            Schedule sched = scheduleMap.get(r.getScheduleId());
            if (sched != null) {
                res.setSubjectName(sched.getSubject());
            } else {
                res.setSubjectName(classSubjectFallback.get(r.getClassId()));
            }
            res.setAttendanceTime(r.getDate().toString()
                    + (r.getCheckInTime() != null ? " " + r.getCheckInTime() : ""));
            res.setStatus(r.getStatus());
            res.setMethod(r.getMethod() != null ? r.getMethod() : "MANUAL");
            return res;
        }).toList();

        return ResponseEntity.ok(
                new ApiResponse<>("Lấy lịch sử điểm danh thành công", "SUCCESS", "", responseList,
                        new ApiResponse.MetaData(0, 1)));
    }

    @GetMapping("/me/schedules/available")
    public ResponseEntity<ApiResponse<List<com.attendance.backend.dto.AvailableScheduleDTO>>> getAvailableSchedules(
            org.springframework.security.core.Authentication authentication) {
        String studentId = authentication.getName();
        List<com.attendance.backend.dto.AvailableScheduleDTO> schedules =
                attendanceService.getAvailableSchedulesForStudent(studentId);
        return ResponseEntity.ok(
                new ApiResponse<>("Lấy danh sách lịch học mở điểm danh thành công", "SUCCESS", "", schedules));
    }

    @GetMapping("/me/schedules")
    public ResponseEntity<ApiResponse<List<com.attendance.backend.dto.ScheduleDTO>>> getMyWeeklySchedules(
            org.springframework.security.core.Authentication authentication) {
        String studentId = authentication.getName();
        com.attendance.backend.dto.StudentDTO student = studentService.getStudentById(studentId);
        Long activeSemesterId = semesterRepository.findByIsActiveTrue()
                .map(com.attendance.backend.entity.Semester::getId)
                .orElse(null);

        List<com.attendance.backend.dto.ScheduleDTO> schedules = new java.util.ArrayList<>();
        if (student.getClassId() != null && !student.getClassId().trim().isEmpty()) {
            List<String> classIds = Arrays.stream(student.getClassId().split(","))
                    .map(String::trim).filter(s -> !s.isEmpty()).toList();
            for (String classId : classIds) {
                scheduleRepository.findByClassId(classId).stream()
                        .filter(s -> activeSemesterId != null && activeSemesterId.equals(s.getSemesterId()))
                        .map(s -> com.attendance.backend.dto.ScheduleDTO.builder()
                                .id(s.getId())
                                .classId(s.getClassId())
                                .subject(s.getSubject())
                                .teacherId(s.getTeacherId())
                                .teacherName(s.getTeacherName())
                                .dayOfWeek(s.getDayOfWeek())
                                .startTime(s.getStartTime())
                                .endTime(s.getEndTime())
                                .room(s.getRoom())
                                .locationId(s.getLocationId())
                                .semesterId(s.getSemesterId())
                                .sessionsCount(s.getSessionsCount())
                                .build())
                        .forEach(schedules::add);
            }
        }
        return ResponseEntity.ok(
                new ApiResponse<>("Lấy danh sách lịch học trong tuần thành công", "SUCCESS", "", schedules));
    }
}
