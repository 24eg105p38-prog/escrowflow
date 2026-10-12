package com.escrowflow.dto;

import com.escrowflow.model.Contract;
import com.escrowflow.model.Milestone;
import com.escrowflow.model.StatusHistory;
import com.escrowflow.model.TransactionRecord;

import java.util.List;

public class ContractDetailResponse {
    private Contract contract;
    private List<Milestone> milestones;
    private List<TransactionRecord> transactions;
    private List<StatusHistory> history;

    public ContractDetailResponse() {}

    public ContractDetailResponse(Contract contract, List<Milestone> milestones, List<TransactionRecord> transactions, List<StatusHistory> history) {
        this.contract = contract;
        this.milestones = milestones;
        this.transactions = transactions;
        this.history = history;
    }

    public Contract getContract() { return contract; }
    public void setContract(Contract contract) { this.contract = contract; }

    public List<Milestone> getMilestones() { return milestones; }
    public void setMilestones(List<Milestone> milestones) { this.milestones = milestones; }

    public List<TransactionRecord> getTransactions() { return transactions; }
    public void setTransactions(List<TransactionRecord> transactions) { this.transactions = transactions; }

    public List<StatusHistory> getHistory() { return history; }
    public void setHistory(List<StatusHistory> history) { this.history = history; }
}
