package com.escrowflow.controller;

import com.escrowflow.config.JwtTokenProvider;
import com.escrowflow.dto.BidRequest;
import com.escrowflow.dto.JobRequest;
import com.escrowflow.model.Bid;
import com.escrowflow.model.Contract;
import com.escrowflow.model.Job;
import com.escrowflow.service.ContractService;
import com.escrowflow.service.JobService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;
    private final ContractService contractService;
    private final JwtTokenProvider jwtTokenProvider;

    public JobController(JobService jobService, ContractService contractService, JwtTokenProvider jwtTokenProvider) {
        this.jobService = jobService;
        this.contractService = contractService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    private Long extractUserId(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return jwtTokenProvider.getUserIdFromJWT(bearer.substring(7));
        }
        throw new RuntimeException("Unauthorized");
    }

    @GetMapping
    public ResponseEntity<List<Job>> getAllJobs() {
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Job> getJobById(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJobById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> createJob(@RequestBody JobRequest jobRequest, HttpServletRequest request) {
        try {
            Long clientId = extractUserId(request);
            Job created = jobService.createJob(clientId, jobRequest);
            return ResponseEntity.ok(created);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{jobId}/bids")
    public ResponseEntity<List<Bid>> getJobBids(@PathVariable Long jobId) {
        return ResponseEntity.ok(jobService.getBidsForJob(jobId));
    }

    @PostMapping("/{jobId}/bids")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> submitBid(@PathVariable Long jobId, @RequestBody BidRequest bidRequest, HttpServletRequest request) {
        try {
            Long freelancerId = extractUserId(request);
            Bid created = jobService.submitBid(jobId, freelancerId, bidRequest);
            return ResponseEntity.ok(created);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{jobId}/bids/{bidId}/accept")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> acceptBid(@PathVariable Long jobId,
                                       @PathVariable Long bidId,
                                       @RequestBody(required = false) JobRequest optionalMilestones,
                                       HttpServletRequest request) {
        try {
            Long clientId = extractUserId(request);
            Contract contract = contractService.acceptBidAndCreateContract(
                    jobId,
                    bidId,
                    clientId,
                    optionalMilestones != null ? optionalMilestones.getMilestones() : null
            );
            return ResponseEntity.ok(contract);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
