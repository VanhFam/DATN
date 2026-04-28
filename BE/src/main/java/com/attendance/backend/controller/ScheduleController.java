package com.attendance.backend.controller;

import com.attendance.backend.dto.ScheduleDTO;
import com.attendance.backend.service.ScheduleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/schedules")
public class ScheduleController {

    private final ScheduleService scheduleService;
    private final com.attendance.backend.repository.TeacherRepository teacherRepository;
    private final com.attendance.backend.repository.ScheduleRepository scheduleRepository;

    public ScheduleController(ScheduleService scheduleService,
                              com.attendance.backend.repository.TeacherRepository teacherRepository,
                              com.attendance.backend.repository.ScheduleRepository scheduleRepository) {
        this.scheduleService = scheduleService;
        this.teacherRepository = teacherRepository;
        this.scheduleRepository = scheduleRepository;
    }

    @GetMapping
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<List<ScheduleDTO>> getAll(org.springframework.security.core.Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        
        if (!isAdmin) {
            String username = authentication.getName();
            // Thử lấy theo username trước (username = teacherId)
            List<ScheduleDTO> schedules = scheduleService.getByTeacher(username);
            
            // Fallback: nếu không thấy, thử qua profile mapping
            if (schedules.isEmpty()) {
                String profileId = teacherRepository.findByUsernameOrId(username)
                        .map(com.attendance.backend.entity.Teacher::getId).orElse(username);
                if (!profileId.equals(username)) {
                    schedules = scheduleService.getByTeacher(profileId);
                }
            }
            return ResponseEntity.ok(schedules);
        }
        return ResponseEntity.ok(scheduleService.getAllSchedules());
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<ScheduleDTO>> getByClass(@PathVariable String classId) {
        return ResponseEntity.ok(scheduleService.getByClass(classId));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<ScheduleDTO>> getByTeacher(@PathVariable String teacherId) {
        return ResponseEntity.ok(scheduleService.getByTeacher(teacherId));
    }

    @GetMapping("/teacher/{teacherId}/today")
    public ResponseEntity<List<ScheduleDTO>> getTodayByTeacher(
            @PathVariable String teacherId,
            @RequestParam String dayOfWeek) {
        return ResponseEntity.ok(scheduleService.getByTeacherAndDay(teacherId, dayOfWeek));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScheduleDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(scheduleService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ScheduleDTO> create(@RequestBody ScheduleDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(scheduleService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ScheduleDTO> update(@PathVariable String id, @RequestBody ScheduleDTO dto) {
        return ResponseEntity.ok(scheduleService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        scheduleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
