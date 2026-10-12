package com.escrowflow.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Milestone {
    private Long id;
    private Long contractId;
    private String title;
    private String description;
    private BigDecimal amount;
    private int dueDateDays;
    private String status; // PENDING, SUBMITTED, ACCEPTED, PAID
    private String statedNote;
    private String deliverableEvidence;
    private String disputeReason;
    private int orderIndex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Milestone() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getContractId() { return contractId; }
    public void setContractId(Long contractId) { this.contractId = contractId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public int getDueDateDays() { return dueDateDays; }
    public void setDueDateDays(int dueDateDays) { this.dueDateDays = dueDateDays; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getStatedNote() { return statedNote; }
    public void setStatedNote(String statedNote) { this.statedNote = statedNote; }

    public String getDeliverableEvidence() { return deliverableEvidence; }
    public void setDeliverableEvidence(String deliverableEvidence) { this.deliverableEvidence = deliverableEvidence; }

    public String getDisputeReason() { return disputeReason; }
    public void setDisputeReason(String disputeReason) { this.disputeReason = disputeReason; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
