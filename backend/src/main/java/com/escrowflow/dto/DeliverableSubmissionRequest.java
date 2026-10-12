package com.escrowflow.dto;

public class DeliverableSubmissionRequest {
    private String evidence;
    private String note;

    public DeliverableSubmissionRequest() {}

    public DeliverableSubmissionRequest(String evidence, String note) {
        this.evidence = evidence;
        this.note = note;
    }

    public String getEvidence() { return evidence; }
    public void setEvidence(String evidence) { this.evidence = evidence; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
