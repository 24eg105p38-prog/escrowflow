package com.escrowflow.dto;

import java.math.BigDecimal;
import java.util.List;

public class JobRequest {
    private String title;
    private String description;
    private String category;
    private BigDecimal budget;
    private List<MilestoneDraftDto> milestones;

    public JobRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getBudget() { return budget; }
    public void setBudget(BigDecimal budget) { this.budget = budget; }

    public List<MilestoneDraftDto> getMilestones() { return milestones; }
    public void setMilestones(List<MilestoneDraftDto> milestones) { this.milestones = milestones; }
}
