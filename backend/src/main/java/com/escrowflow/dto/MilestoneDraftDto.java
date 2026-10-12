package com.escrowflow.dto;

import java.math.BigDecimal;

public class MilestoneDraftDto {
    private String title;
    private String description;
    private BigDecimal amount;
    private int dueDateDays;

    public MilestoneDraftDto() {}

    public MilestoneDraftDto(String title, String description, BigDecimal amount, int dueDateDays) {
        this.title = title;
        this.description = description;
        this.amount = amount;
        this.dueDateDays = dueDateDays;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public int getDueDateDays() { return dueDateDays; }
    public void setDueDateDays(int dueDateDays) { this.dueDateDays = dueDateDays; }
}
