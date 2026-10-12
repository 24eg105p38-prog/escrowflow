package com.escrowflow.model;

import java.time.LocalDateTime;

public class StatusHistory {
    private Long id;
    private Long milestoneId;
    private String milestoneTitle;
    private String fromStatus;
    private String toStatus;
    private Long changedByUserId;
    private String changedByUsername;
    private String changedByRole;
    private String reason;
    private LocalDateTime createdAt;

    public StatusHistory() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMilestoneId() { return milestoneId; }
    public void setMilestoneId(Long milestoneId) { this.milestoneId = milestoneId; }

    public String getMilestoneTitle() { return milestoneTitle; }
    public void setMilestoneTitle(String milestoneTitle) { this.milestoneTitle = milestoneTitle; }

    public String getFromStatus() { return fromStatus; }
    public void setFromStatus(String fromStatus) { this.fromStatus = fromStatus; }

    public String getToStatus() { return toStatus; }
    public void setToStatus(String toStatus) { this.toStatus = toStatus; }

    public Long getChangedByUserId() { return changedByUserId; }
    public void setChangedByUserId(Long changedByUserId) { this.changedByUserId = changedByUserId; }

    public String getChangedByUsername() { return changedByUsername; }
    public void setChangedByUsername(String changedByUsername) { this.changedByUsername = changedByUsername; }

    public String getChangedByRole() { return roleWithPrefix(); }
    public String roleWithPrefix() { return changedByRole; }
    public void setChangedByRole(String changedByRole) { this.changedByRole = changedByRole; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
