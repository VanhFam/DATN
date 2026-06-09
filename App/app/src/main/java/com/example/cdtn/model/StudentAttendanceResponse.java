package com.example.cdtn.model;

public class StudentAttendanceResponse {

    private String className;
    private String subjectName;
    private String attendanceTime;
    private String status;
    private String method;

    public String getClassName() { return className; }
    public String getSubjectName() { return subjectName; }
    public String getAttendanceTime() { return attendanceTime; }
    public String getStatus() { return status; }
    public String getMethod() { return method; }
}