package com.attendance.backend.dto;

public class LoginResponse {
    private String token;
    private String tokenType = "Bearer";
    private String id;
    private String username;
    private String name;
    private String role;
    private String email;
    private String classId;

    public LoginResponse() {
    }

    public LoginResponse(String token, String tokenType, String id, String username, String name, String role, String email, String classId) {
        this.token = token;
        this.tokenType = tokenType;
        this.id = id;
        this.username = username;
        this.name = name;
        this.role = role;
        this.email = email;
        this.classId = classId;
    }

    public static LoginResponseBuilder builder() {
        return new LoginResponseBuilder();
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getClassId() {
        return classId;
    }

    public void setClassId(String classId) {
        this.classId = classId;
    }

    public static class LoginResponseBuilder {
        private String token;
        private String tokenType = "Bearer";
        private String id;
        private String username;
        private String name;
        private String role;
        private String email;
        private String classId;

        LoginResponseBuilder() {
        }

        public LoginResponseBuilder token(String token) {
            this.token = token;
            return this;
        }

        public LoginResponseBuilder tokenType(String tokenType) {
            this.tokenType = tokenType;
            return this;
        }

        public LoginResponseBuilder id(String id) {
            this.id = id;
            return this;
        }

        public LoginResponseBuilder username(String username) {
            this.username = username;
            return this;
        }

        public LoginResponseBuilder name(String name) {
            this.name = name;
            return this;
        }

        public LoginResponseBuilder role(String role) {
            this.role = role;
            return this;
        }

        public LoginResponseBuilder email(String email) {
            this.email = email;
            return this;
        }

        public LoginResponseBuilder classId(String classId) {
            this.classId = classId;
            return this;
        }

        public LoginResponse build() {
            return new LoginResponse(token, tokenType, id, username, name, role, email, classId);
        }
    }
}
