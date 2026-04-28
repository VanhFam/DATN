package com.attendance.backend.controller;

import com.attendance.backend.dto.StudentDTO;
import com.attendance.backend.service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/students")
public class StudentController {

    private final StudentService studentService;
    private final com.attendance.backend.repository.TeacherRepository teacherRepository;
    private final com.attendance.backend.repository.ScheduleRepository scheduleRepository;

    public StudentController(StudentService studentService, 
                             com.attendance.backend.repository.TeacherRepository teacherRepository,
                             com.attendance.backend.repository.ScheduleRepository scheduleRepository) {
        this.studentService = studentService;
        this.teacherRepository = teacherRepository;
        this.scheduleRepository = scheduleRepository;
    }

    @GetMapping
    public ResponseEntity<List<StudentDTO>> getAll(org.springframework.security.core.Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        boolean isTeacher = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TEACHER") || a.getAuthority().equals("TEACHER"));
        
        if (!isAdmin && isTeacher) {
            String username = authentication.getName();
            List<String> classIds = scheduleRepository.findByTeacherIdIgnoreCase(username).stream()
                    .map(com.attendance.backend.entity.Schedule::getClassId).distinct().toList();
            
            // Fallback: thử profile ID nếu không tìm thấy lịch theo username
            if (classIds.isEmpty()) {
                String profileId = teacherRepository.findByUsernameOrId(username)
                        .map(com.attendance.backend.entity.Teacher::getId).orElse(username);
                if (!profileId.equals(username)) {
                    classIds = scheduleRepository.findByTeacherIdIgnoreCase(profileId).stream()
                            .map(com.attendance.backend.entity.Schedule::getClassId).distinct().toList();
                }
            }

            if (classIds.isEmpty()) return ResponseEntity.ok(java.util.Collections.emptyList());

            // Bước 1: tìm qua bảng student_classes (enrollment chính thức)
            List<StudentDTO> teacherStudents = studentService.getStudentsByClasses(classIds);
            
            // Bước 2: Fallback tìm qua bản ghi điểm danh (cho dữ liệu cũ chưa enroll)
            if (teacherStudents.isEmpty()) {
                teacherStudents = studentService.getStudentsByAttendanceClasses(classIds);
            }
            
            // Bước 3: Nếu vẫn rỗng → trả về tất cả sinh viên (chưa có dữ liệu điểm danh)
            if (teacherStudents.isEmpty()) {
                teacherStudents = studentService.getAllStudents();
            }
            
            return ResponseEntity.ok(teacherStudents);
        }
        
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<StudentDTO>> getByClass(@PathVariable String classId) {
        // Bước 1: tìm qua enrollment chính thức (student_classes)
        List<StudentDTO> students = studentService.getStudentsByClass(classId);
        // Bước 2: fallback qua bản ghi điểm danh
        if (students.isEmpty()) {
            students = studentService.getStudentsByAttendanceClasses(java.util.List.of(classId));
        }
        // Bước 3: nếu vẫn rỗng, trả về tất cả sinh viên
        if (students.isEmpty()) {
            students = studentService.getAllStudents();
        }
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
}
