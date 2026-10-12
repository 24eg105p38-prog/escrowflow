package com.escrowflow.dto;

public class DisputeRequest {
    private String reason;

    public DisputeRequest() {}

    public DisputeRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
