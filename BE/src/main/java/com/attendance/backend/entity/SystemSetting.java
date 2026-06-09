package com.attendance.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "system_settings")
public class SystemSetting {

    @Id
    @Column(length = 50)
    private String settingKey;

    @Column(columnDefinition = "TEXT")
    private String settingValue;

    @Column(length = 100)
    private String description;

    public SystemSetting() {
    }

    public SystemSetting(String settingKey, String settingValue, String description) {
        this.settingKey = settingKey;
        this.settingValue = settingValue;
        this.description = description;
    }

    public String getSettingKey() {
        return settingKey;
    }

    public void setSettingKey(String settingKey) {
        this.settingKey = settingKey;
    }

    public String getSettingValue() {
        return settingValue;
    }

    public void setSettingValue(String settingValue) {
        this.settingValue = settingValue;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public static SystemSettingBuilder builder() {
        return new SystemSettingBuilder();
    }

    public static class SystemSettingBuilder {
        private String settingKey;
        private String settingValue;
        private String description;

        public SystemSettingBuilder settingKey(String settingKey) {
            this.settingKey = settingKey;
            return this;
        }

        public SystemSettingBuilder settingValue(String settingValue) {
            this.settingValue = settingValue;
            return this;
        }

        public SystemSettingBuilder description(String description) {
            this.description = description;
            return this;
        }

        public SystemSetting build() {
            return new SystemSetting(settingKey, settingValue, description);
        }
    }
}
