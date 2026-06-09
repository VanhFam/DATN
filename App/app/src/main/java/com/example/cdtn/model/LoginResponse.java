package com.example.cdtn.model;

public class LoginResponse {

    private String token;
    private String tokenType;
    private String id;
    private String username;
    private String name;
    private String role;
    private String email;
    private String classId;

    public String getToken() {
        return token;
    }

    public String getRole() {
        return role;
    }

    public String getName() {
        return name;
    }
}