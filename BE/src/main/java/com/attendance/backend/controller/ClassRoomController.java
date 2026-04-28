package com.attendance.backend.controller;

import com.attendance.backend.entity.ClassRoom;
import com.attendance.backend.service.ClassRoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/classes")
public class ClassRoomController {

    private final ClassRoomService classRoomService;
    private final com.attendance.backend.repository.TeacherRepository teacherRepository;
    private final com.attendance.backend.repository.ScheduleRepository scheduleRepository;
    private final com.attendance.backend.repository.StudentRepository studentRepository;

    public ClassRoomController(ClassRoomService classRoomService, 
                               com.attendance.backend.repository.TeacherRepository teacherRepository,
                               com.attendance.backend.repository.ScheduleRepository scheduleRepository,
                               com.attendance.backend.repository.StudentRepository studentRepository) {
        this.classRoomService = classRoomService;
        this.teacherRepository = teacherRepository;
        this.scheduleRepository = scheduleRepository;
        this.studentRepository = studentRepository;
    }

    @GetMapping
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<List<ClassRoom>> getAll(org.springframework.security.core.Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        
        if (!isAdmin) {
            String username = authentication.getName();
            boolean isTeacher = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_TEACHER") || a.getAuthority().equals("TEACHER"));

            if (isTeacher) {
                // Logic cho Giáo viên: Thử lấy classId trực tiếp theo username trước
                String teacherId = username;
                List<String> classIds = scheduleRepository.findByTeacherIdIgnoreCase(teacherId).stream()
                        .map(com.attendance.backend.entity.Schedule::getClassId).distinct().toList();
                
                // Nếu không thấy, thử tìm qua profile mapping
                if (classIds.isEmpty()) {
                    String profileId = teacherRepository.findByUsernameOrId(username)
                            .map(com.attendance.backend.entity.Teacher::getId).orElse(username);
                    if (!profileId.equals(username)) {
                        classIds = scheduleRepository.findByTeacherIdIgnoreCase(profileId).stream()
                                .map(com.attendance.backend.entity.Schedule::getClassId).distinct().toList();
                    }
                }
                
                if (classIds.isEmpty()) return ResponseEntity.ok(java.util.Collections.emptyList());

                List<ClassRoom> teacherClasses = classIds.stream()
                        .map(id -> {
                            try { return classRoomService.getById(id); } catch (Exception e) { return null; }
                        })
                        .filter(java.util.Objects::nonNull)
                        .toList();
                return ResponseEntity.ok(teacherClasses);
            } else {
                // Logic cho Học sinh: Lấy các lớp mà học sinh này tham gia
                List<ClassRoom> studentClasses = studentRepository.findByUsername(username)
                    .map(s -> new java.util.ArrayList<>(s.getClasses()))
                    .orElse(new java.util.ArrayList<>());
                return ResponseEntity.ok(studentClasses);
            }
        }
        
        return ResponseEntity.ok(classRoomService.getAllClasses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassRoom> getById(@PathVariable String id) {
        return ResponseEntity.ok(classRoomService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClassRoom> create(@RequestBody ClassRoom classRoom) {
        return ResponseEntity.status(HttpStatus.CREATED).body(classRoomService.create(classRoom));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClassRoom> update(@PathVariable String id, @RequestBody ClassRoom classRoom) {
        return ResponseEntity.ok(classRoomService.update(id, classRoom));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        classRoomService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
