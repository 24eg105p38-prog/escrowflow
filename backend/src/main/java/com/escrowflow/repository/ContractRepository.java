package com.escrowflow.repository;

import com.escrowflow.model.Contract;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class ContractRepository {
    private final JdbcTemplate jdbcTemplate;

    public ContractRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Contract> contractRowMapper = (rs, rowNum) -> {
        Contract contract = new Contract();
        contract.setId(rs.getLong("id"));
        contract.setJobId(rs.getLong("job_id"));
        contract.setJobTitle(rs.getString("job_title"));
        contract.setClientId(rs.getLong("client_id"));
        contract.setClientName(rs.getString("client_name"));
        contract.setFreelancerId(rs.getLong("freelancer_id"));
        contract.setFreelancerName(rs.getString("freelancer_name"));
        contract.setTotalAmount(rs.getBigDecimal("total_amount"));
        contract.setEscrowBalance(rs.getBigDecimal("escrow_balance"));
        contract.setStatus(rs.getString("status"));
        contract.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : LocalDateTime.now());
        return contract;
    };

    public Contract create(Contract contract) {
        String sql = "INSERT INTO contracts (job_id, client_id, freelancer_id, total_amount, escrow_balance, status) VALUES (?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, contract.getJobId());
            ps.setLong(2, contract.getClientId());
            ps.setLong(3, contract.getFreelancerId());
            ps.setBigDecimal(4, contract.getTotalAmount());
            ps.setBigDecimal(5, contract.getEscrowBalance());
            ps.setString(6, contract.getStatus() != null ? contract.getStatus() : "ACTIVE");
            return ps;
        }, keyHolder);

        if (keyHolder.getKeys() != null) {
            for (var entry : keyHolder.getKeys().entrySet()) {
                if ("id".equalsIgnoreCase(entry.getKey()) && entry.getValue() instanceof Number n) {
                    contract.setId(n.longValue());
                    break;
                }
            }
        } else if (keyHolder.getKey() != null) {
            contract.setId(keyHolder.getKey().longValue());
        }
        return contract;
    }

    public Optional<Contract> findById(Long id) {
        String sql = """
            SELECT c.*, j.title as job_title, uc.username as client_name, uf.username as freelancer_name
            FROM contracts c
            JOIN jobs j ON c.job_id = j.id
            JOIN users uc ON c.client_id = uc.id
            JOIN users uf ON c.freelancer_id = uf.id
            WHERE c.id = ?
        """;
        List<Contract> list = jdbcTemplate.query(sql, contractRowMapper, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<Contract> findAll() {
        String sql = """
            SELECT c.*, j.title as job_title, uc.username as client_name, uf.username as freelancer_name
            FROM contracts c
            JOIN jobs j ON c.job_id = j.id
            JOIN users uc ON c.client_id = uc.id
            JOIN users uf ON c.freelancer_id = uf.id
            ORDER BY c.created_at DESC
        """;
        return jdbcTemplate.query(sql, contractRowMapper);
    }

    public List<Contract> findByClientId(Long clientId) {
        String sql = """
            SELECT c.*, j.title as job_title, uc.username as client_name, uf.username as freelancer_name
            FROM contracts c
            JOIN jobs j ON c.job_id = j.id
            JOIN users uc ON c.client_id = uc.id
            JOIN users uf ON c.freelancer_id = uf.id
            WHERE c.client_id = ?
            ORDER BY c.created_at DESC
        """;
        return jdbcTemplate.query(sql, contractRowMapper, clientId);
    }

    public List<Contract> findByFreelancerId(Long freelancerId) {
        String sql = """
            SELECT c.*, j.title as job_title, uc.username as client_name, uf.username as freelancer_name
            FROM contracts c
            JOIN jobs j ON c.job_id = j.id
            JOIN users uc ON c.client_id = uc.id
            JOIN users uf ON c.freelancer_id = uf.id
            WHERE c.freelancer_id = ?
            ORDER BY c.created_at DESC
        """;
        return jdbcTemplate.query(sql, contractRowMapper, freelancerId);
    }

    public void decrementEscrowBalance(Long contractId, BigDecimal amount) {
        jdbcTemplate.update("UPDATE contracts SET escrow_balance = escrow_balance - ? WHERE id = ?", amount, contractId);
    }

    public void updateStatus(Long contractId, String status) {
        jdbcTemplate.update("UPDATE contracts SET status = ? WHERE id = ?", status, contractId);
    }
}
