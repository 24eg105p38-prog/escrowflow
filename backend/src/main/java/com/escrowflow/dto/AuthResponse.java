package com.escrowflow.dto;

import java.math.BigDecimal;

public class AuthResponse {
    private String token;
    private Long id;
    private String username;
    private String email;
    private String role;
    private String fullName;
    private BigDecimal mockBalance;

    public AuthResponse() {}

    public AuthResponse(String token, Long id, String username, String email, String role, String fullName, BigDecimal mockBalance) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.fullName = fullName;
        this.mockBalance = mockBalance;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public BigDecimal getMockBalance() { return mockBalance; }
    public void setMockBalance(BigDecimal mockBalance) { this.mockBalance = mockBalance; }
}
