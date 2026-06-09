package com.attendance.backend.controller;

import com.attendance.backend.dto.TeacherDTO;
import com.attendance.backend.service.TeacherService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teachers")
public class TeacherController {

    private final TeacherService teacherService;

    public TeacherController(TeacherService teacherService) {
        this.teacherService = teacherService;
    }

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) Integer page,
                                    @RequestParam(required = false) Integer limit,
                                    @RequestParam(required = false, defaultValue = "") String search) {
        if (page != null || limit != null) {
            return ResponseEntity.ok(teacherService.getTeachersPage(search, page, limit));
        }
        return ResponseEntity.ok(teacherService.getAllTeachers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeacherDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(teacherService.getTeacherById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TeacherDTO> create(@RequestBody TeacherDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teacherService.createTeacher(dto));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TeacherDTO>> createBulk(@RequestBody List<TeacherDTO> dtos) {
        return ResponseEntity.ok(teacherService.createTeachersBulk(dtos));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TeacherDTO> update(@PathVariable String id, @RequestBody TeacherDTO dto) {
        return ResponseEntity.ok(teacherService.updateTeacher(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        teacherService.deleteTeacher(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TeacherDTO> toggleActive(@PathVariable String id) {
        return ResponseEntity.ok(teacherService.toggleActive(id));
    }
}
