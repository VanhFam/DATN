package com.attendance.backend.controller;

import com.attendance.backend.entity.Semester;
import com.attendance.backend.service.SemesterService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/semesters")
public class SemesterController {

    private final SemesterService semesterService;

    public SemesterController(SemesterService semesterService) {
        this.semesterService = semesterService;
    }

    @GetMapping
    public ResponseEntity<List<Semester>> getAll() {
        return ResponseEntity.ok(semesterService.getAllSemesters());
    }

    @GetMapping("/active")
    public ResponseEntity<Semester> getActive() {
        return ResponseEntity.ok(semesterService.getActiveSemester());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Semester> getById(@PathVariable Long id) {
        return ResponseEntity.ok(semesterService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Semester> create(@RequestBody Semester semester) {
        return ResponseEntity.status(HttpStatus.CREATED).body(semesterService.create(semester));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Semester> update(@PathVariable Long id, @RequestBody Semester semester) {
        return ResponseEntity.ok(semesterService.update(id, semester));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Semester> activate(@PathVariable Long id) {
        return ResponseEntity.ok(semesterService.setActive(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        semesterService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
