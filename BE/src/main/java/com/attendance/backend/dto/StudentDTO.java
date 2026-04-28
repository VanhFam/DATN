package com.attendance.backend.dto;

public class StudentDTO {
    private String id;
    private String name;
    private String classId;
    private String gender;
    private String dob;
    private String phone;
    private String faceImagePath;
    private String faceEmbedding;
    private Boolean isActive;

    public StudentDTO() {
    }

    public StudentDTO(String id, String name, String classId, String gender, String dob, String phone, String faceImagePath, String faceEmbedding, Boolean isActive) {
        this.id = id;
        this.name = name;
        this.classId = classId;
        this.gender = gender;
        this.dob = dob;
        this.phone = phone;
        this.faceImagePath = faceImagePath;
        this.faceEmbedding = faceEmbedding;
        this.isActive = isActive;
    }

    public static StudentDTOBuilder builder() {
        return new StudentDTOBuilder();
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

    public String getClassId() {
        return classId;
    }

    public void setClassId(String classId) {
        this.classId = classId;
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

    public static class StudentDTOBuilder {
        private String id;
        private String name;
        private String classId;
        private String gender;
        private String dob;
        private String phone;
        private String faceImagePath;
        private String faceEmbedding;
        private Boolean isActive;

        StudentDTOBuilder() {
        }

        public StudentDTOBuilder id(String id) {
            this.id = id;
            return this;
        }

        public StudentDTOBuilder name(String name) {
            this.name = name;
            return this;
        }

        public StudentDTOBuilder classId(String classId) {
            this.classId = classId;
            return this;
        }

        public StudentDTOBuilder gender(String gender) {
            this.gender = gender;
            return this;
        }

        public StudentDTOBuilder dob(String dob) {
            this.dob = dob;
            return this;
        }

        public StudentDTOBuilder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public StudentDTOBuilder faceImagePath(String faceImagePath) {
            this.faceImagePath = faceImagePath;
            return this;
        }

        public StudentDTOBuilder faceEmbedding(String faceEmbedding) {
            this.faceEmbedding = faceEmbedding;
            return this;
        }

        public StudentDTOBuilder isActive(Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public StudentDTO build() {
            return new StudentDTO(id, name, classId, gender, dob, phone, faceImagePath, faceEmbedding, isActive);
        }
    }
}
