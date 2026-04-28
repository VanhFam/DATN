package com.attendance.backend.service;

import com.attendance.backend.entity.SystemSetting;
import com.attendance.backend.repository.SystemSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SystemSettingService {

    private final SystemSettingRepository repository;

    public SystemSettingService(SystemSettingRepository repository) {
        this.repository = repository;
    }

    public Map<String, String> getAllSettings() {
        Map<String, String> map = new HashMap<>();
        repository.findAll().forEach(s -> {
            if (s.getSettingKey() != null && s.getSettingValue() != null) {
                map.put(s.getSettingKey(), s.getSettingValue());
            }
        });
        return map;
    }

    @Transactional
    public void updateSettings(Map<String, String> settings) {
        if (settings == null) return;
        
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key == null || value == null) continue;

            SystemSetting setting = repository.findById(key)
                    .orElse(new SystemSetting(key, value, null));
            setting.setSettingValue(value);
            repository.saveAndFlush(setting);
        }
    }

    public String getSetting(String key, String defaultValue) {
        return repository.findById(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }
}
