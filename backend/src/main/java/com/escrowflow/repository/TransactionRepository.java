package com.escrowflow.repository;

import com.escrowflow.model.TransactionRecord;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public class TransactionRepository {
    private final JdbcTemplate jdbcTemplate;

    public TransactionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<TransactionRecord> txRowMapper = (rs, rowNum) -> {
        TransactionRecord tx = new TransactionRecord();
        tx.setId(rs.getLong("id"));
        tx.setContractId(rs.getLong("contract_id"));
        tx.setMilestoneId(rs.getObject("milestone_id") != null ? rs.getLong("milestone_id") : null);
        tx.setMilestoneTitle(rs.getString("milestone_title"));
        tx.setFromUserId(rs.getObject("from_user_id") != null ? rs.getLong("from_user_id") : null);
        tx.setFromUserName(rs.getString("from_user_name"));
        tx.setToUserId(rs.getObject("to_user_id") != null ? rs.getLong("to_user_id") : null);
        tx.setToUserName(rs.getString("to_user_name"));
        tx.setAmount(rs.getBigDecimal("amount"));
        tx.setTransactionType(rs.getString("transaction_type"));
        tx.setDescription(rs.getString("description"));
        tx.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : LocalDateTime.now());
        return tx;
    };

    public void record(Long contractId, Long milestoneId, Long fromUserId, Long toUserId, BigDecimal amount, String type, String description) {
        String sql = """
            INSERT INTO transactions (contract_id, milestone_id, from_user_id, to_user_id, amount, transaction_type, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """;
        jdbcTemplate.update(sql, contractId, milestoneId, fromUserId, toUserId, amount, type, description);
    }

    public List<TransactionRecord> findByContractId(Long contractId) {
        String sql = """
            SELECT t.*, m.title as milestone_title, uf.username as from_user_name, ut.username as to_user_name
            FROM transactions t
            LEFT JOIN milestones m ON t.milestone_id = m.id
            LEFT JOIN users uf ON t.from_user_id = uf.id
            LEFT JOIN users ut ON t.to_user_id = ut.id
            WHERE t.contract_id = ?
            ORDER BY t.created_at ASC
        """;
        return jdbcTemplate.query(sql, txRowMapper, contractId);
    }

    public List<TransactionRecord> findByUserId(Long userId) {
        String sql = """
            SELECT t.*, m.title as milestone_title, uf.username as from_user_name, ut.username as to_user_name
            FROM transactions t
            LEFT JOIN milestones m ON t.milestone_id = m.id
            LEFT JOIN users uf ON t.from_user_id = uf.id
            LEFT JOIN users ut ON t.to_user_id = ut.id
            WHERE t.from_user_id = ? OR t.to_user_id = ?
            ORDER BY t.created_at DESC
        """;
        return jdbcTemplate.query(sql, txRowMapper, userId, userId);
    }

    public List<TransactionRecord> findAll() {
        String sql = """
            SELECT t.*, m.title as milestone_title, uf.username as from_user_name, ut.username as to_user_name
            FROM transactions t
            LEFT JOIN milestones m ON t.milestone_id = m.id
            LEFT JOIN users uf ON t.from_user_id = uf.id
            LEFT JOIN users ut ON t.to_user_id = ut.id
            ORDER BY t.created_at DESC
        """;
        return jdbcTemplate.query(sql, txRowMapper);
    }
}
