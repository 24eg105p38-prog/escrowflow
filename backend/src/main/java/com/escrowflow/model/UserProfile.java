package com.escrowflow.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class UserProfile {
    private Long id;
    private Long userId;
    private String fullName;
    private String bio;
    private BigDecimal mockBalance;
    private LocalDateTime createdAt;

    public UserProfile() {}

    public UserProfile(Long id, Long userId, String fullName, String bio, BigDecimal mockBalance, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.fullName = fullName;
        this.bio = bio;
        this.mockBalance = mockBalance;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public BigDecimal getMockBalance() { return mockBalance; }
    public void setMockBalance(BigDecimal mockBalance) { this.mockBalance = mockBalance; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
