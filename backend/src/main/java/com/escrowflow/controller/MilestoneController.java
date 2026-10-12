package com.escrowflow.controller;

import com.escrowflow.config.JwtTokenProvider;
import com.escrowflow.dto.DeliverableSubmissionRequest;
import com.escrowflow.dto.DisputeRequest;
import com.escrowflow.model.Milestone;
import com.escrowflow.model.StatusHistory;
import com.escrowflow.repository.StatusHistoryRepository;
import com.escrowflow.service.MilestoneService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/milestones")
public class MilestoneController {

    private final MilestoneService milestoneService;
    private final StatusHistoryRepository statusHistoryRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public MilestoneController(MilestoneService milestoneService,
                               StatusHistoryRepository statusHistoryRepository,
                               JwtTokenProvider jwtTokenProvider) {
        this.milestoneService = milestoneService;
        this.statusHistoryRepository = statusHistoryRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    private Long extractUserId(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return jwtTokenProvider.getUserIdFromJWT(bearer.substring(7));
        }
        throw new RuntimeException("Unauthorized");
    }

    /**
     * Endpoint from Table 8:
     * POST /api/milestones/{id}/submit -> Submit deliverable evidence, PENDING -> SUBMITTED (assigned Freelancer)
     */
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> submitDeliverable(@PathVariable Long id,
                                               @RequestBody DeliverableSubmissionRequest request,
                                               HttpServletRequest httpRequest) {
        try {
            Long freelancerId = extractUserId(httpRequest);
            Milestone milestone = milestoneService.submitDeliverable(id, freelancerId, request);
            return ResponseEntity.ok(milestone);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Endpoint from Table 8:
     * POST /api/milestones/{id}/approve -> Approve submission, SUBMITTED -> ACCEPTED -> PAID (contract-owning Client only)
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> approveMilestone(@PathVariable Long id, HttpServletRequest httpRequest) {
        try {
            Long clientId = extractUserId(httpRequest);
            Milestone milestone = milestoneService.approveMilestone(id, clientId);
            return ResponseEntity.ok(milestone);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Endpoint from Table 8:
     * POST /api/milestones/{id}/dispute -> Return to PENDING with a stated reason (contract-owning Client only)
     */
    @PostMapping("/{id}/dispute")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> disputeMilestone(@PathVariable Long id,
                                              @RequestBody DisputeRequest request,
                                              HttpServletRequest httpRequest) {
        try {
            Long clientId = extractUserId(httpRequest);
            Milestone milestone = milestoneService.disputeMilestone(id, clientId, request);
            return ResponseEntity.ok(milestone);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<StatusHistory>> getMilestoneHistory(@PathVariable Long id) {
        return ResponseEntity.ok(statusHistoryRepository.findByMilestoneId(id));
    }
}
