package com.attendance.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "students")
public class Student {

    @Id
    @Column(length = 20)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "student_classes",
        joinColumns = @JoinColumn(name = "student_id"),
        inverseJoinColumns = @JoinColumn(name = "class_id")
    )
    private Set<ClassRoom> classes = new HashSet<>();

    @Column(name = "user_id")
    private Long userId;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    @Column(length = 10)
    private String gender;

    @Column(length = 20)
    private String dob;

    @Column(length = 20)
    private String phone;

    @Column(length = 500)
    private String faceImagePath;

    @Column(length = 2000)
    private String faceEmbedding;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Student() {
    }

    public Student(String id, String name, String gender, String dob, String phone, String faceImagePath, String faceEmbedding, Boolean isActive, Long userId) {
        this.id = id;
        this.name = name;
        this.gender = gender;
        this.dob = dob;
        this.phone = phone;
        this.faceImagePath = faceImagePath;
        this.faceEmbedding = faceEmbedding;
        this.isActive = isActive;
        this.userId = userId;
    }

    public static StudentBuilder builder() {
        return new StudentBuilder();
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

    public Set<ClassRoom> getClasses() {
        return classes;
    }

    public void setClasses(Set<ClassRoom> classes) {
        this.classes = classes;
    }

    @Transient
    public String getClassId() {
        if (classes == null || classes.isEmpty()) return null;
        return classes.stream().map(ClassRoom::getId).collect(Collectors.joining(","));
    }

    public void setClassId(String classId) {
        // Dummy setter for compatibility
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getFaceImagePath() {
        return faceImagePath;
    }

    public void setFaceImagePath(String faceImagePath) {
        this.faceImagePath = faceImagePath;
    }
    public String getFaceEmbedding() {
        return faceEmbedding;
    }

    public void setFaceEmbedding(String faceEmbedding) {
        this.faceEmbedding = faceEmbedding;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public static class StudentBuilder {
        private String id;
        private String name;
        private String gender;
        private String dob;
        private String phone;
        private String faceImagePath;
        private String faceEmbedding;
        private Boolean isActive = true;
        private Long userId;

        StudentBuilder() {
        }

        public StudentBuilder id(String id) {
            this.id = id;
            return this;
        }

        public StudentBuilder name(String name) {
            this.name = name;
            return this;
        }



        public StudentBuilder gender(String gender) {
            this.gender = gender;
            return this;
        }

        public StudentBuilder dob(String dob) {
            this.dob = dob;
            return this;
        }

        public StudentBuilder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public StudentBuilder faceImagePath(String faceImagePath) {
            this.faceImagePath = faceImagePath;
            return this;
        }

        public StudentBuilder faceEmbedding(String faceEmbedding) {
            this.faceEmbedding = faceEmbedding;
            return this;
        }

        public StudentBuilder isActive(Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public StudentBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public Student build() {
            return new Student(id, name, gender, dob, phone, faceImagePath, faceEmbedding, isActive, userId);
        }
    }
}
