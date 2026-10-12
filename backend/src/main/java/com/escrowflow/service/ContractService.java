package com.escrowflow.service;

import com.escrowflow.dto.ContractDetailResponse;
import com.escrowflow.dto.MilestoneDraftDto;
import com.escrowflow.model.*;
import com.escrowflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class ContractService {

    private final JobRepository jobRepository;
    private final BidRepository bidRepository;
    private final ContractRepository contractRepository;
    private final MilestoneRepository milestoneRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ContractService(JobRepository jobRepository,
                           BidRepository bidRepository,
                           ContractRepository contractRepository,
                           MilestoneRepository milestoneRepository,
                           StatusHistoryRepository statusHistoryRepository,
                           TransactionRepository transactionRepository,
                           UserRepository userRepository,
                           NotificationService notificationService) {
        this.jobRepository = jobRepository;
        this.bidRepository = bidRepository;
        this.contractRepository = contractRepository;
        this.milestoneRepository = milestoneRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public Contract acceptBidAndCreateContract(Long jobId, Long bidId, Long clientId, List<MilestoneDraftDto> customMilestones) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with ID: " + jobId));

        // Authority check: Only job owner can accept bid
        if (!job.getClientId().equals(clientId)) {
            throw new RuntimeException("Unauthorized: Only the client who posted the job can accept a bid");
        }

        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new RuntimeException("Bid not found with ID: " + bidId));

        if (!bid.getJobId().equals(jobId)) {
            throw new RuntimeException("Bid does not belong to this job");
        }

        // Deduct mock balance from client into Escrow (Client must have enough balance)
        UserProfile clientProfile = userRepository.findProfileByUserId(clientId)
                .orElseThrow(() -> new RuntimeException("Client profile not found"));

        if (clientProfile.getMockBalance().compareTo(bid.getProposedAmount()) < 0) {
            // Auto top-up for demo convenience if balance insufficient
            userRepository.addToMockBalance(clientId, bid.getProposedAmount().add(new BigDecimal("1000.00")));
        }
        userRepository.addToMockBalance(clientId, bid.getProposedAmount().negate());

        // Update bid status and job status
        bidRepository.updateStatus(bidId, "ACCEPTED");
        bidRepository.rejectOtherBidsForJob(jobId, bidId);
        jobRepository.updateStatus(jobId, "CONTRACTED");

        // Create Contract
        Contract contract = new Contract();
        contract.setJobId(jobId);
        contract.setClientId(clientId);
        contract.setFreelancerId(bid.getFreelancerId());
        contract.setTotalAmount(bid.getProposedAmount());
        contract.setEscrowBalance(bid.getProposedAmount());
        contract.setStatus("ACTIVE");
        Contract createdContract = contractRepository.create(contract);

        // Record ESCROW_LOCK transaction
        transactionRepository.record(
                createdContract.getId(),
                null,
                clientId,
                null,
                bid.getProposedAmount(),
                "ESCROW_LOCK",
                "Contract created: $" + bid.getProposedAmount() + " locked into escrow from client balance"
        );

        // Decompose into milestones
        List<MilestoneDraftDto> drafts = (customMilestones != null && !customMilestones.isEmpty())
                ? customMilestones
                : generateDefaultMilestones(bid.getProposedAmount());

        int order = 1;
        for (MilestoneDraftDto draft : drafts) {
            Milestone m = new Milestone();
            m.setContractId(createdContract.getId());
            m.setTitle(draft.getTitle());
            m.setDescription(draft.getDescription());
            m.setAmount(draft.getAmount());
            m.setDueDateDays(draft.getDueDateDays() > 0 ? draft.getDueDateDays() : 7);
            m.setStatus("PENDING");
            m.setOrderIndex(order++);
            Milestone saved = milestoneRepository.create(m);

            statusHistoryRepository.record(saved.getId(), "NONE", "PENDING", clientId, "Milestone initialized upon contract activation");
        }

        // Notify freelancer
        notificationService.notifyUser(
                bid.getFreelancerId(),
                clientId,
                createdContract.getId(),
                null,
                "Congratulations! Your bid for '" + job.getTitle() + "' was accepted. Escrow funds locked."
        );

        return createdContract;
    }

    private List<MilestoneDraftDto> generateDefaultMilestones(BigDecimal total) {
        List<MilestoneDraftDto> list = new ArrayList<>();
        BigDecimal p1 = total.multiply(new BigDecimal("0.30")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal p2 = total.multiply(new BigDecimal("0.40")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal p3 = total.subtract(p1).subtract(p2).setScale(2, RoundingMode.HALF_UP);

        list.add(new MilestoneDraftDto("Phase 1: Architecture & Prototyping", "Core system design, schema setup and mockups", p1, 5));
        list.add(new MilestoneDraftDto("Phase 2: Functional Implementation", "Primary business logic, frontend-backend integration", p2, 12));
        list.add(new MilestoneDraftDto("Phase 3: Testing, Verification & Delivery", "End-to-end testing, documentation and production handover", p3, 5));
        return list;
    }

    public List<Contract> getContractsForUser(Long userId, String role) {
        if ("ADMIN".equalsIgnoreCase(role)) {
            return contractRepository.findAll();
        } else if ("CLIENT".equalsIgnoreCase(role)) {
            return contractRepository.findByClientId(userId);
        } else {
            return contractRepository.findByFreelancerId(userId);
        }
    }

    public Contract getContractById(Long id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contract not found with ID: " + id));
    }

    public ContractDetailResponse getContractDetails(Long contractId, Long userId, String role) {
        Contract contract = getContractById(contractId);

        // Access check
        if (!"ADMIN".equalsIgnoreCase(role) &&
            !contract.getClientId().equals(userId) &&
            !contract.getFreelancerId().equals(userId)) {
            throw new RuntimeException("Unauthorized to view this contract");
        }

        List<Milestone> milestones = milestoneRepository.findByContractId(contractId);
        List<TransactionRecord> transactions = transactionRepository.findByContractId(contractId);
        List<StatusHistory> history = statusHistoryRepository.findByContractId(contractId);

        return new ContractDetailResponse(contract, milestones, transactions, history);
    }
}
