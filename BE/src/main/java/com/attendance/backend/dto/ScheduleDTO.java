package com.attendance.backend.dto;

public class ScheduleDTO {
    private String id;
    private String classId;
    private String subject;
    private String teacherId;
    private String teacherName;
    private String dayOfWeek;
    private String startTime;
    private String endTime;
    private String room;
    private String locationId;
    private Long semesterId;
    private Integer sessionsCount;

    public ScheduleDTO() {
    }

    public ScheduleDTO(String id, String classId, String subject, String teacherId, String teacherName, String dayOfWeek, String startTime, String endTime, String room, String locationId) {
        this.id = id;
        this.classId = classId;
        this.subject = subject;
        this.teacherId = teacherId;
        this.teacherName = teacherName;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.room = room;
        this.locationId = locationId;
    }

    public static ScheduleDTOBuilder builder() {
        return new ScheduleDTOBuilder();
    }

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

    public String getLocationId() {
        return locationId;
    }

    public void setLocationId(String locationId) {
        this.locationId = locationId;
    }

    public Long getSemesterId() {
        return semesterId;
    }

    public void setSemesterId(Long semesterId) {
        this.semesterId = semesterId;
    }

    public Integer getSessionsCount() {
        return sessionsCount;
    }

    public void setSessionsCount(Integer sessionsCount) {
        this.sessionsCount = sessionsCount;
    }

    public static class ScheduleDTOBuilder {
        private String id;
        private String classId;
        private String subject;
        private String teacherId;
        private String teacherName;
        private String dayOfWeek;
        private String startTime;
        private String endTime;
        private String room;
        private String locationId;
        private Long semesterId;
        private Integer sessionsCount;

        ScheduleDTOBuilder() {
        }

        public ScheduleDTOBuilder id(String id) {
            this.id = id;
            return this;
        }

        public ScheduleDTOBuilder classId(String classId) {
            this.classId = classId;
            return this;
        }

        public ScheduleDTOBuilder subject(String subject) {
            this.subject = subject;
            return this;
        }

        public ScheduleDTOBuilder teacherId(String teacherId) {
            this.teacherId = teacherId;
            return this;
        }

        public ScheduleDTOBuilder teacherName(String teacherName) {
            this.teacherName = teacherName;
            return this;
        }

        public ScheduleDTOBuilder dayOfWeek(String dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
            return this;
        }

        public ScheduleDTOBuilder startTime(String startTime) {
            this.startTime = startTime;
            return this;
        }

        public ScheduleDTOBuilder endTime(String endTime) {
            this.endTime = endTime;
            return this;
        }

        public ScheduleDTOBuilder room(String room) {
            this.room = room;
            return this;
        }

        public ScheduleDTOBuilder locationId(String locationId) {
            this.locationId = locationId;
            return this;
        }

        public ScheduleDTOBuilder semesterId(Long semesterId) {
            this.semesterId = semesterId;
            return this;
        }

        public ScheduleDTOBuilder sessionsCount(Integer sessionsCount) {
            this.sessionsCount = sessionsCount;
            return this;
        }

        public ScheduleDTO build() {
            ScheduleDTO dto = new ScheduleDTO(id, classId, subject, teacherId, teacherName, dayOfWeek, startTime, endTime, room, locationId);
            dto.setSemesterId(semesterId);
            dto.setSessionsCount(sessionsCount);
            return dto;
        }
    }
}
