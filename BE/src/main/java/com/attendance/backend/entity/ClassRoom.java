package com.attendance.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "classes")
public class ClassRoom {

    @Id
    @Column(length = 20)
    private String id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(length = 200)
    private String description;

    @Column(name = "max_students", nullable = false)
    private Integer maxStudents = 50;

    @Column(name = "total_sessions")
    private Integer totalSessions;

    @Column(name = "subject_code", length = 50)
    private String subjectCode;

    @Column(name = "semester_id")
    private Long semesterId;

    public ClassRoom() {
    }

    public ClassRoom(String id, String name, String description) {
        this(id, name, description, 50, null, null, null);
    }

    public ClassRoom(String id, String name, String description, Integer maxStudents) {
        this(id, name, description, maxStudents, null, null, null);
    }

    public ClassRoom(String id, String name, String description, Integer maxStudents, Integer totalSessions, String subjectCode) {
        this(id, name, description, maxStudents, totalSessions, subjectCode, null);
    }

    public ClassRoom(String id, String name, String description, Integer maxStudents, Integer totalSessions, String subjectCode, Long semesterId) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.maxStudents = maxStudents != null ? maxStudents : 50;
        this.totalSessions = totalSessions;
        this.subjectCode = subjectCode;
        this.semesterId = semesterId;
    }

    public static ClassRoomBuilder builder() {
        return new ClassRoomBuilder();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getMaxStudents() {
        return maxStudents != null && maxStudents > 0 ? maxStudents : 50;
    }

    public void setMaxStudents(Integer maxStudents) {
        this.maxStudents = (maxStudents != null && maxStudents > 0) ? maxStudents : 50;
    }

    public Integer getTotalSessions() {
        return totalSessions;
    }

    public void setTotalSessions(Integer totalSessions) {
        this.totalSessions = totalSessions;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public void setSubjectCode(String subjectCode) {
        this.subjectCode = subjectCode;
    }

    public Long getSemesterId() {
        return semesterId;
    }

    public void setSemesterId(Long semesterId) {
        this.semesterId = semesterId;
    }

    public static class ClassRoomBuilder {
        private String id;
        private String name;
        private String description;
        private Integer maxStudents = 50;
        private Integer totalSessions;
        private String subjectCode;
        private Long semesterId;

        ClassRoomBuilder() {
        }

        public ClassRoomBuilder id(String id) {
            this.id = id;
            return this;
        }

        public ClassRoomBuilder name(String name) {
            this.name = name;
            return this;
        }

        public ClassRoomBuilder description(String description) {
            this.description = description;
            return this;
        }

        public ClassRoomBuilder maxStudents(Integer maxStudents) {
            this.maxStudents = maxStudents;
            return this;
        }

        public ClassRoomBuilder totalSessions(Integer totalSessions) {
            this.totalSessions = totalSessions;
            return this;
        }

        public ClassRoomBuilder subjectCode(String subjectCode) {
            this.subjectCode = subjectCode;
            return this;
        }

        public ClassRoomBuilder semesterId(Long semesterId) {
            this.semesterId = semesterId;
            return this;
        }

        public ClassRoom build() {
            return new ClassRoom(id, name, description, maxStudents, totalSessions, subjectCode, semesterId);
        }
    }
}
