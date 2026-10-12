package com.escrowflow.controller;

import com.escrowflow.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ContractRepository contractRepository;
    private final TransactionRepository transactionRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;

    public AdminController(ContractRepository contractRepository,
                           TransactionRepository transactionRepository,
                           StatusHistoryRepository statusHistoryRepository,
                           UserRepository userRepository,
                           JobRepository jobRepository) {
        this.contractRepository = contractRepository;
        this.transactionRepository = transactionRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
    }

    @GetMapping("/overview")
    public ResponseEntity<?> getPlatformOverview() {
        return ResponseEntity.ok(Map.of(
                "totalContracts", contractRepository.findAll().size(),
                "contracts", contractRepository.findAll(),
                "allTransactions", transactionRepository.findAll(),
                "statusAuditLogs", statusHistoryRepository.findAll(),
                "users", userRepository.findAll(),
                "jobs", jobRepository.findAll()
        ));
    }
}
