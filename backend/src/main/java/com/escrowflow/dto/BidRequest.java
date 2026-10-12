package com.escrowflow.dto;

import java.math.BigDecimal;
import java.util.List;

public class BidRequest {
    private BigDecimal proposedAmount;
    private String proposedTimeline;
    private String proposalText;
    private List<MilestoneDraftDto> proposedMilestones;

    public BidRequest() {}

    public BigDecimal getProposedAmount() { return proposedAmount; }
    public void setProposedAmount(BigDecimal proposedAmount) { this.proposedAmount = proposedAmount; }

    public String getProposedTimeline() { return proposedTimeline; }
    public void setProposedTimeline(String proposedTimeline) { this.proposedTimeline = proposedTimeline; }

    public String getProposalText() { return proposalText; }
    public void setProposalText(String proposalText) { this.proposalText = proposalText; }

    public List<MilestoneDraftDto> getProposedMilestones() { return proposedMilestones; }
    public void setProposedMilestones(List<MilestoneDraftDto> proposedMilestones) { this.proposedMilestones = proposedMilestones; }
}
