package com.attendance.backend.controller;

import com.attendance.backend.service.SystemSettingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/settings")
public class SystemSettingController {

    private final SystemSettingService settingService;

    public SystemSettingController(SystemSettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> getAll() {
        return ResponseEntity.ok(settingService.getAllSettings());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(@RequestBody Map<String, String> settings) {
        settingService.updateSettings(settings);
        return ResponseEntity.ok(Map.of("message", "Cấu hình hệ thống đã được cập nhật"));
    }
}
