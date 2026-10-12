package com.escrowflow.controller;

import com.escrowflow.config.JwtTokenProvider;
import com.escrowflow.dto.ContractDetailResponse;
import com.escrowflow.model.Contract;
import com.escrowflow.service.ContractService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts")
public class ContractController {

    private final ContractService contractService;
    private final JwtTokenProvider jwtTokenProvider;

    public ContractController(ContractService contractService, JwtTokenProvider jwtTokenProvider) {
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

    private String extractRole(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return jwtTokenProvider.getRoleFromJWT(bearer.substring(7));
        }
        throw new RuntimeException("Unauthorized");
    }

    @GetMapping
    public ResponseEntity<List<Contract>> getMyContracts(HttpServletRequest request) {
        Long userId = extractUserId(request);
        String role = extractRole(request);
        return ResponseEntity.ok(contractService.getContractsForUser(userId, role));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getContractDetails(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long userId = extractUserId(request);
            String role = extractRole(request);
            ContractDetailResponse details = contractService.getContractDetails(id, userId, role);
            return ResponseEntity.ok(details);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Representative REST Endpoint from Table 8:
     * /api/contracts/{id}/ledger -> Retrieve the full transaction and status history for a contract
     */
    @GetMapping("/{id}/ledger")
    public ResponseEntity<?> getContractLedger(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long userId = extractUserId(request);
            String role = extractRole(request);
            ContractDetailResponse details = contractService.getContractDetails(id, userId, role);
            return ResponseEntity.ok(Map.of(
                    "contract", details.getContract(),
                    "transactions", details.getTransactions(),
                    "statusHistory", details.getHistory()
            ));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
