package com.attendance.backend.dto;

public class TeacherDTO {
    private String id;
    private String name;
    private String email;
    private String phone;
    private Boolean isActive;

    public TeacherDTO() {
    }

    public TeacherDTO(String id, String name, String email, String phone, Boolean isActive) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
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

        public TeacherDTOBuilder isActive(Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public TeacherDTO build() {
            return new TeacherDTO(id, name, email, phone, isActive);
        }
    }
}
