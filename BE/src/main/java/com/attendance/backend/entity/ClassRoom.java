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

    public ClassRoom() {
    }

    public ClassRoom(String id, String name, String description) {
        this(id, name, description, 50);
    }

    public ClassRoom(String id, String name, String description, Integer maxStudents) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.maxStudents = maxStudents != null ? maxStudents : 50;
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

    public static class ClassRoomBuilder {
        private String id;
        private String name;
        private String description;
        private Integer maxStudents = 50;

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

        public ClassRoom build() {
            return new ClassRoom(id, name, description, maxStudents);
        }
    }
}
