package com.attendance.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class AttendanceSchemaMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public AttendanceSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute("ALTER TABLE attendance_records MODIFY COLUMN status VARCHAR(20) NOT NULL");
        } catch (Exception e) {
            System.out.println(">>> [MIGRATION] Skip attendance_records.status migration: " + e.getMessage());
        }
    }
}
