package com.example.cdtn.model;

public class ScheduleDTO {
    private String id;
    private String classId;
    private String subject;
    private String teacherId;
    private String dayOfWeek;
    private String startTime;
    private String endTime;
    private String room;

    public String getId() { return id; }
    public String getClassId() { return classId; }
    public String getSubject() { return subject; }
    public String getTeacherId() { return teacherId; }
    public String getDayOfWeek() { return dayOfWeek; }
    public String getStartTime() { return startTime; }
    public String getEndTime() { return endTime; }
    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }
}
