package com.escrowflow.service;

import com.escrowflow.dto.DeliverableSubmissionRequest;
import com.escrowflow.dto.DisputeRequest;
import com.escrowflow.model.Contract;
import com.escrowflow.model.Milestone;
import com.escrowflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final ContractRepository contractRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final JobRepository jobRepository;

    public MilestoneService(MilestoneRepository milestoneRepository,
                            ContractRepository contractRepository,
                            StatusHistoryRepository statusHistoryRepository,
                            TransactionRepository transactionRepository,
                            UserRepository userRepository,
                            NotificationService notificationService,
                            JobRepository jobRepository) {
        this.milestoneRepository = milestoneRepository;
        this.contractRepository = contractRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.jobRepository = jobRepository;
    }

    /**
     * Freelancer submits deliverable evidence.
     * Lifecycle: PENDING -> SUBMITTED
     */
    @Transactional
    public Milestone submitDeliverable(Long milestoneId, Long freelancerId, DeliverableSubmissionRequest request) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found with ID: " + milestoneId));

        Contract contract = contractRepository.findById(milestone.getContractId())
                .orElseThrow(() -> new RuntimeException("Contract not found for milestone"));

        // Authority Check: Only assigned Freelancer can submit deliverable
        if (!contract.getFreelancerId().equals(freelancerId)) {
            throw new RuntimeException("Unauthorized: Only the assigned freelancer can submit deliverables for this milestone");
        }

        if ("PAID".equalsIgnoreCase(milestone.getStatus()) || "ACCEPTED".equalsIgnoreCase(milestone.getStatus())) {
            throw new RuntimeException("Cannot submit deliverable for an already approved/paid milestone");
        }

        String oldStatus = milestone.getStatus();
        milestoneRepository.submitDeliverable(milestoneId, request.getEvidence(), request.getNote());

        // Audit Trail: Record Status History
        statusHistoryRepository.record(
                milestoneId,
                oldStatus,
                "SUBMITTED",
                freelancerId,
                "Deliverable submitted with evidence: " + (request.getNote() != null ? request.getNote() : "Submitted for review")
        );

        // Event-driven alert: Notify Client
        notificationService.notifyUser(
                contract.getClientId(),
                freelancerId,
                contract.getId(),
                milestoneId,
                "Deliverable submitted for milestone: '" + milestone.getTitle() + "'. Please review and verify."
        );

        return milestoneRepository.findById(milestoneId).orElseThrow();
    }

    /**
     * Client approves deliverable and releases funds.
     * Lifecycle: SUBMITTED -> ACCEPTED -> PAID
     * Executes inside a single Spring-managed ACID transaction.
     */
    @Transactional
    public Milestone approveMilestone(Long milestoneId, Long clientId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found with ID: " + milestoneId));

        Contract contract = contractRepository.findById(milestone.getContractId())
                .orElseThrow(() -> new RuntimeException("Contract not found for milestone"));

        // Method-level Client Authority Guarantee:
        // Restricted to the verified contract-owning client through claims-based identity
        if (!contract.getClientId().equals(clientId)) {
            throw new RuntimeException("Unauthorized: Only the contract-owning client can approve deliverables and release funds");
        }

        if (!"SUBMITTED".equalsIgnoreCase(milestone.getStatus())) {
            throw new RuntimeException("Milestone must be in SUBMITTED state to be approved (current state: " + milestone.getStatus() + ")");
        }

        String oldStatus = milestone.getStatus();

        // 1. Mark milestone as PAID
        milestoneRepository.approveMilestone(milestoneId, "Approved by client; funds released from escrow.");

        // 2. Decrement contract escrow balance
        contractRepository.decrementEscrowBalance(contract.getId(), milestone.getAmount());

        // 3. Increment freelancer mock balance
        userRepository.addToMockBalance(contract.getFreelancerId(), milestone.getAmount());

        // 4. Record immutable ledger transaction row
        transactionRepository.record(
                contract.getId(),
                milestoneId,
                contract.getClientId(),
                contract.getFreelancerId(),
                milestone.getAmount(),
                "RELEASE_PAYMENT",
                "Milestone approved: '" + milestone.getTitle() + "' - $" + milestone.getAmount() + " released to freelancer"
        );

        // 5. Record status history audit trail
        statusHistoryRepository.record(
                milestoneId,
                oldStatus,
                "PAID",
                clientId,
                "Milestone accepted and settled by client."
        );

        // 6. Event-driven alert: Notify Freelancer
        notificationService.notifyUser(
                contract.getFreelancerId(),
                clientId,
                contract.getId(),
                milestoneId,
                "Milestone approved! $" + milestone.getAmount() + " released to your account for '" + milestone.getTitle() + "'."
        );

        // 7. Check if all milestones are paid -> complete contract
        if (milestoneRepository.allMilestonesCompleted(contract.getId())) {
            contractRepository.updateStatus(contract.getId(), "COMPLETED");
            jobRepository.updateStatus(contract.getJobId(), "COMPLETED");
            notificationService.notifyUser(
                    contract.getClientId(),
                    clientId,
                    contract.getId(),
                    null,
                    "All milestones completed! Contract #" + contract.getId() + " is now fully settled."
            );
            notificationService.notifyUser(
                    contract.getFreelancerId(),
                    clientId,
                    contract.getId(),
                    null,
                    "All milestones completed! Contract #" + contract.getId() + " is now fully settled."
            );
        }

        return milestoneRepository.findById(milestoneId).orElseThrow();
    }

    /**
     * Client disputes / requests revision on deliverable.
     * Lifecycle: SUBMITTED -> PENDING (with mandatory stated reason)
     */
    @Transactional
    public Milestone disputeMilestone(Long milestoneId, Long clientId, DisputeRequest request) {
        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new RuntimeException("A stated reason is strictly required before requesting revision or disputing");
        }

        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found with ID: " + milestoneId));

        Contract contract = contractRepository.findById(milestone.getContractId())
                .orElseThrow(() -> new RuntimeException("Contract not found for milestone"));

        // Client authority check
        if (!contract.getClientId().equals(clientId)) {
            throw new RuntimeException("Unauthorized: Only the contract-owning client can dispute or request revisions");
        }

        if (!"SUBMITTED".equalsIgnoreCase(milestone.getStatus())) {
            throw new RuntimeException("Only SUBMITTED deliverables can be disputed or sent for revision");
        }

        String oldStatus = milestone.getStatus();

        // Returns to PENDING with recorded reason
        milestoneRepository.disputeMilestone(milestoneId, request.getReason().trim());

        // Audit Trail: Status History preserved
        statusHistoryRepository.record(
                milestoneId,
                oldStatus,
                "PENDING",
                clientId,
                "Revision requested by client: " + request.getReason().trim()
        );

        // Alert Freelancer
        notificationService.notifyUser(
                contract.getFreelancerId(),
                clientId,
                contract.getId(),
                milestoneId,
                "Revision requested on milestone '" + milestone.getTitle() + "'. Reason: " + request.getReason().trim()
        );

        return milestoneRepository.findById(milestoneId).orElseThrow();
    }
}
