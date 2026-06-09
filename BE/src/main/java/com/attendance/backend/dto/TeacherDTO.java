package com.attendance.backend.dto;

public class TeacherDTO {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String gender;
    private Boolean isActive;

    public TeacherDTO() {
    }

    public TeacherDTO(String id, String name, String email, String phone, String gender, Boolean isActive) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.gender = gender;
        this.isActive = isActive;
    }

    public static TeacherDTOBuilder builder() {
        return new TeacherDTOBuilder();
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

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public static class TeacherDTOBuilder {
        private String id;
        private String name;
        private String email;
        private String phone;
        private String gender;
        private Boolean isActive;

        TeacherDTOBuilder() {
        }

        public TeacherDTOBuilder id(String id) {
            this.id = id;
            return this;
        }

        public TeacherDTOBuilder name(String name) {
            this.name = name;
            return this;
        }

        public TeacherDTOBuilder email(String email) {
            this.email = email;
            return this;
        }

        public TeacherDTOBuilder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public TeacherDTOBuilder gender(String gender) {
            this.gender = gender;
            return this;
        }

        public TeacherDTOBuilder isActive(Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public TeacherDTO build() {
            return new TeacherDTO(id, name, email, phone, gender, isActive);
        }
    }
}
