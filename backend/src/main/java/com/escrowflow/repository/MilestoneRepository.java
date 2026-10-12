package com.escrowflow.repository;

import com.escrowflow.model.Milestone;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class MilestoneRepository {
    private final JdbcTemplate jdbcTemplate;

    public MilestoneRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Milestone> milestoneRowMapper = (rs, rowNum) -> {
        Milestone m = new Milestone();
        m.setId(rs.getLong("id"));
        m.setContractId(rs.getLong("contract_id"));
        m.setTitle(rs.getString("title"));
        m.setDescription(rs.getString("description"));
        m.setAmount(rs.getBigDecimal("amount"));
        m.setDueDateDays(rs.getInt("due_date_days"));
        m.setStatus(rs.getString("status"));
        m.setStatedNote(rs.getString("stated_note"));
        m.setDeliverableEvidence(rs.getString("deliverable_evidence"));
        m.setDisputeReason(rs.getString("dispute_reason"));
        m.setOrderIndex(rs.getInt("order_index"));
        m.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : LocalDateTime.now());
        m.setUpdatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : LocalDateTime.now());
        return m;
    };

    public Milestone create(Milestone m) {
        String sql = """
            INSERT INTO milestones (contract_id, title, description, amount, due_date_days, status, stated_note, deliverable_evidence, dispute_reason, order_index, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, m.getContractId());
            ps.setString(2, m.getTitle());
            ps.setString(3, m.getDescription());
            ps.setBigDecimal(4, m.getAmount());
            ps.setInt(5, m.getDueDateDays());
            ps.setString(6, m.getStatus() != null ? m.getStatus() : "PENDING");
            ps.setString(7, m.getStatedNote());
            ps.setString(8, m.getDeliverableEvidence());
            ps.setString(9, m.getDisputeReason());
            ps.setInt(10, m.getOrderIndex());
            return ps;
        }, keyHolder);

        if (keyHolder.getKeys() != null) {
            for (var entry : keyHolder.getKeys().entrySet()) {
                if ("id".equalsIgnoreCase(entry.getKey()) && entry.getValue() instanceof Number n) {
                    m.setId(n.longValue());
                    break;
                }
            }
        } else if (keyHolder.getKey() != null) {
            m.setId(keyHolder.getKey().longValue());
        }
        return m;
    }

    public Optional<Milestone> findById(Long id) {
        String sql = "SELECT * FROM milestones WHERE id = ?";
        List<Milestone> list = jdbcTemplate.query(sql, milestoneRowMapper, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<Milestone> findByContractId(Long contractId) {
        String sql = "SELECT * FROM milestones WHERE contract_id = ? ORDER BY order_index ASC, id ASC";
        return jdbcTemplate.query(sql, milestoneRowMapper, contractId);
    }

    public void updateStatus(Long id, String status) {
        jdbcTemplate.update("UPDATE milestones SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", status, id);
    }

    public void submitDeliverable(Long id, String evidence, String note) {
        String sql = """
            UPDATE milestones
            SET status = 'SUBMITTED',
                deliverable_evidence = ?,
                stated_note = ?,
                dispute_reason = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """;
        jdbcTemplate.update(sql, evidence, note, id);
    }

    public void approveMilestone(Long id, String statedNote) {
        String sql = """
            UPDATE milestones
            SET status = 'PAID',
                stated_note = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """;
        jdbcTemplate.update(sql, statedNote, id);
    }

    public void disputeMilestone(Long id, String reason) {
        String sql = """
            UPDATE milestones
            SET status = 'PENDING',
                dispute_reason = ?,
                stated_note = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """;
        String note = "Revision requested: " + reason;
        jdbcTemplate.update(sql, reason, note, id);
    }

    public boolean allMilestonesCompleted(Long contractId) {
        String sql = "SELECT COUNT(*) FROM milestones WHERE contract_id = ? AND status != 'PAID'";
        Integer remaining = jdbcTemplate.queryForObject(sql, Integer.class, contractId);
        return remaining != null && remaining == 0;
    }
}
