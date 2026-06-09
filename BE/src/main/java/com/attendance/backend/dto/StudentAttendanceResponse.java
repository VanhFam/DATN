package com.attendance.backend.dto;

public class StudentAttendanceResponse {
    private String className;
    private String subjectName;
    private String attendanceTime;
    private String status;
    private String method;

    public StudentAttendanceResponse() {}

    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public String getAttendanceTime() { return attendanceTime; }
    public void setAttendanceTime(String attendanceTime) { this.attendanceTime = attendanceTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
}
