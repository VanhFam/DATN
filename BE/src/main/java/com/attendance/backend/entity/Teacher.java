package com.attendance.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "teachers")
public class Teacher {

    @Id
    @Column(length = 20)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    /** Lớp chủ nhiệm (nếu có) */
    @Column(name = "assigned_class", length = 20)
    private String assignedClass;

    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    @Column(name = "is_active")
    private Boolean isActive = true;

    public Teacher() {
    }

    public Teacher(String id, String name, String email, String phone, Boolean isActive, Long userId) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.isActive = isActive;
        this.userId = userId;
    }

    public static TeacherBuilder builder() {
        return new TeacherBuilder();
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
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

    public static class TeacherBuilder {
        private String id;
        private String name;
        private String email;
        private String phone;
        private Boolean isActive = true;
        private Long userId;

        TeacherBuilder() {
        }

        public TeacherBuilder id(String id) {
            this.id = id;
            return this;
        }

        public TeacherBuilder name(String name) {
            this.name = name;
            return this;
        }

        public TeacherBuilder email(String email) {
            this.email = email;
            return this;
        }

        public TeacherBuilder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public TeacherBuilder isActive(Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public TeacherBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public Teacher build() {
            return new Teacher(id, name, email, phone, isActive, userId);
        }
    }
}
