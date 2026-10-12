package com.escrowflow.repository;

import com.escrowflow.model.Notification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public class NotificationRepository {
    private final JdbcTemplate jdbcTemplate;

    public NotificationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Notification> notifRowMapper = (rs, rowNum) -> {
        Notification n = new Notification();
        n.setId(rs.getLong("id"));
        n.setUserId(rs.getLong("user_id"));
        n.setActorId(rs.getObject("actor_id") != null ? rs.getLong("actor_id") : null);
        n.setActorName(rs.getString("actor_name"));
        n.setContractId(rs.getObject("contract_id") != null ? rs.getLong("contract_id") : null);
        n.setMilestoneId(rs.getObject("milestone_id") != null ? rs.getLong("milestone_id") : null);
        n.setMilestoneTitle(rs.getString("milestone_title"));
        n.setMessage(rs.getString("message"));
        n.setRead(rs.getBoolean("is_read"));
        n.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : LocalDateTime.now());
        return n;
    };

    public void create(Long userId, Long actorId, Long contractId, Long milestoneId, String message) {
        String sql = """
            INSERT INTO notifications (user_id, actor_id, contract_id, milestone_id, message, is_read)
            VALUES (?, ?, ?, ?, ?, FALSE)
        """;
        jdbcTemplate.update(sql, userId, actorId, contractId, milestoneId, message);
    }

    public List<Notification> findByUserId(Long userId) {
        String sql = """
            SELECT n.*, u.username as actor_name, m.title as milestone_title
            FROM notifications n
            LEFT JOIN users u ON n.actor_id = u.id
            LEFT JOIN milestones m ON n.milestone_id = m.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
        """;
        return jdbcTemplate.query(sql, notifRowMapper, userId);
    }

    public void markAllAsRead(Long userId) {
        jdbcTemplate.update("UPDATE notifications SET is_read = TRUE WHERE user_id = ?", userId);
    }

    public void markAsRead(Long notifId, Long userId) {
        jdbcTemplate.update("UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?", notifId, userId);
    }
}
