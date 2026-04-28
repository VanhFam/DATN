package com.attendance.backend.dto;

public class AttendanceSummaryDTO {
    private String studentId;
    private double attendanceRate;
    private String alertLevel; // NONE, YELLOW, RED
    private String message;

    public AttendanceSummaryDTO() {}

    public AttendanceSummaryDTO(String studentId, double attendanceRate, String alertLevel, String message) {
        this.studentId = studentId;
        this.attendanceRate = attendanceRate;
        this.alertLevel = alertLevel;
        this.message = message;
    }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public double getAttendanceRate() { return attendanceRate; }
    public void setAttendanceRate(double attendanceRate) { this.attendanceRate = attendanceRate; }

    public String getAlertLevel() { return alertLevel; }
    public void setAlertLevel(String alertLevel) { this.alertLevel = alertLevel; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
