package com.attendance.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "schedules")
public class Schedule {

    @Id
    @Column(length = 20)
    private String id;

    @Column(name = "class_id", nullable = false, length = 20)
    private String classId;

    @Column(name = "teacher_id", nullable = false, length = 20)
    private String teacherId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", referencedColumnName = "id", insertable = false, updatable = false)
    private ClassRoom classRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Teacher teacher;

    @Column(nullable = false, length = 100)
    private String subject;

    /** Tên giáo viên (cache để hiển thị nhanh) */
    @Column(length = 100)
    private String teacherName;

    @Column(nullable = false, length = 10)
    private String dayOfWeek;

    @Column(nullable = false, length = 10)
    private String startTime;

    @Column(nullable = false, length = 10)
    private String endTime;

    @Column(length = 20)
    private String room;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getClassId() {
        return classId;
    }

    public void setClassId(String classId) {
        this.classId = classId;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
    }

    public String getTeacherName() {
        return teacherName;
    }

    public void setTeacherName(String teacherName) {
        this.teacherName = teacherName;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }

    public Schedule() {
    }

    public Schedule(String id, String classId, String subject, String teacherId, String teacherName, String dayOfWeek, String startTime, String endTime, String room) {
        this.id = id;
        this.classId = classId;
        this.subject = subject;
        this.teacherId = teacherId;
        this.teacherName = teacherName;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.room = room;
    }

    public static ScheduleBuilder builder() {
        return new ScheduleBuilder();
    }

    public static class ScheduleBuilder {
        private String id;
        private String classId;
        private String subject;
        private String teacherId;
        private String teacherName;
        private String dayOfWeek;
        private String startTime;
        private String endTime;
        private String room;

        ScheduleBuilder() {
        }

        public ScheduleBuilder id(String id) {
            this.id = id;
            return this;
        }

        public ScheduleBuilder classId(String classId) {
            this.classId = classId;
            return this;
        }

        public ScheduleBuilder subject(String subject) {
            this.subject = subject;
            return this;
        }

        public ScheduleBuilder teacherId(String teacherId) {
            this.teacherId = teacherId;
            return this;
        }

        public ScheduleBuilder teacherName(String teacherName) {
            this.teacherName = teacherName;
            return this;
        }

        public ScheduleBuilder dayOfWeek(String dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
            return this;
        }

        public ScheduleBuilder startTime(String startTime) {
            this.startTime = startTime;
            return this;
        }

        public ScheduleBuilder endTime(String endTime) {
            this.endTime = endTime;
            return this;
        }

        public ScheduleBuilder room(String room) {
            this.room = room;
            return this;
        }

        public Schedule build() {
            return new Schedule(id, classId, subject, teacherId, teacherName, dayOfWeek, startTime, endTime, room);
        }
    }
}
