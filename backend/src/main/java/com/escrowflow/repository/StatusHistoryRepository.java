package com.escrowflow.repository;

import com.escrowflow.model.StatusHistory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public class StatusHistoryRepository {
    private final JdbcTemplate jdbcTemplate;

    public StatusHistoryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<StatusHistory> historyRowMapper = (rs, rowNum) -> {
        StatusHistory h = new StatusHistory();
        h.setId(rs.getLong("id"));
        h.setMilestoneId(rs.getLong("milestone_id"));
        h.setMilestoneTitle(rs.getString("milestone_title"));
        h.setFromStatus(rs.getString("from_status"));
        h.setToStatus(rs.getString("to_status"));
        h.setChangedByUserId(rs.getLong("changed_by_user_id"));
        h.setChangedByUsername(rs.getString("changed_by_username"));
        h.setChangedByRole(rs.getString("changed_by_role"));
        h.setReason(rs.getString("reason"));
        h.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : LocalDateTime.now());
        return h;
    };

    public void record(Long milestoneId, String fromStatus, String toStatus, Long changedByUserId, String reason) {
        String sql = "INSERT INTO status_history (milestone_id, from_status, to_status, changed_by_user_id, reason) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, milestoneId, fromStatus, toStatus, changedByUserId, reason);
    }

    public List<StatusHistory> findByMilestoneId(Long milestoneId) {
        String sql = """
            SELECT sh.*, m.title as milestone_title, u.username as changed_by_username, u.role as changed_by_role
            FROM status_history sh
            JOIN milestones m ON sh.milestone_id = m.id
            JOIN users u ON sh.changed_by_user_id = u.id
            WHERE sh.milestone_id = ?
            ORDER BY sh.created_at ASC
        """;
        return jdbcTemplate.query(sql, historyRowMapper, milestoneId);
    }

    public List<StatusHistory> findByContractId(Long contractId) {
        String sql = """
            SELECT sh.*, m.title as milestone_title, u.username as changed_by_username, u.role as changed_by_role
            FROM status_history sh
            JOIN milestones m ON sh.milestone_id = m.id
            JOIN users u ON sh.changed_by_user_id = u.id
            WHERE m.contract_id = ?
            ORDER BY sh.created_at ASC
        """;
        return jdbcTemplate.query(sql, historyRowMapper, contractId);
    }

    public List<StatusHistory> findAll() {
        String sql = """
            SELECT sh.*, m.title as milestone_title, u.username as changed_by_username, u.role as changed_by_role
            FROM status_history sh
            JOIN milestones m ON sh.milestone_id = m.id
            JOIN users u ON sh.changed_by_user_id = u.id
            ORDER BY sh.created_at DESC
        """;
        return jdbcTemplate.query(sql, historyRowMapper);
    }
}
