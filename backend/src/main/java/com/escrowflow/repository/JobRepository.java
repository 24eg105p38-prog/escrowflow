package com.escrowflow.repository;

import com.escrowflow.model.Job;
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
public class JobRepository {
    private final JdbcTemplate jdbcTemplate;

    public JobRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Job> jobRowMapper = (rs, rowNum) -> {
        Job job = new Job();
        job.setId(rs.getLong("id"));
        job.setClientId(rs.getLong("client_id"));
        job.setClientName(rs.getString("client_name"));
        job.setTitle(rs.getString("title"));
        job.setDescription(rs.getString("description"));
        job.setCategory(rs.getString("category"));
        job.setBudget(rs.getBigDecimal("budget"));
        job.setStatus(rs.getString("status"));
        job.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : LocalDateTime.now());
        job.setBidCount(rs.getInt("bid_count"));
        return job;
    };

    public Job create(Job job) {
        String sql = "INSERT INTO jobs (client_id, title, description, category, budget, status) VALUES (?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, job.getClientId());
            ps.setString(2, job.getTitle());
            ps.setString(3, job.getDescription());
            ps.setString(4, job.getCategory());
            ps.setBigDecimal(5, job.getBudget());
            ps.setString(6, job.getStatus() != null ? job.getStatus() : "OPEN");
            return ps;
        }, keyHolder);

        if (keyHolder.getKeys() != null) {
            for (var entry : keyHolder.getKeys().entrySet()) {
                if ("id".equalsIgnoreCase(entry.getKey()) && entry.getValue() instanceof Number n) {
                    job.setId(n.longValue());
                    break;
                }
            }
        } else if (keyHolder.getKey() != null) {
            job.setId(keyHolder.getKey().longValue());
        }
        return job;
    }

    public Optional<Job> findById(Long id) {
        String sql = """
            SELECT j.*, u.username as client_name,
                   (SELECT COUNT(*) FROM bids b WHERE b.job_id = j.id) as bid_count
            FROM jobs j
            JOIN users u ON j.client_id = u.id
            WHERE j.id = ?
        """;
        List<Job> list = jdbcTemplate.query(sql, jobRowMapper, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<Job> findAll() {
        String sql = """
            SELECT j.*, u.username as client_name,
                   (SELECT COUNT(*) FROM bids b WHERE b.job_id = j.id) as bid_count
            FROM jobs j
            JOIN users u ON j.client_id = u.id
            ORDER BY j.created_at DESC
        """;
        return jdbcTemplate.query(sql, jobRowMapper);
    }

    public List<Job> findByClientId(Long clientId) {
        String sql = """
            SELECT j.*, u.username as client_name,
                   (SELECT COUNT(*) FROM bids b WHERE b.job_id = j.id) as bid_count
            FROM jobs j
            JOIN users u ON j.client_id = u.id
            WHERE j.client_id = ?
            ORDER BY j.created_at DESC
        """;
        return jdbcTemplate.query(sql, jobRowMapper, clientId);
    }

    public void updateStatus(Long id, String status) {
        jdbcTemplate.update("UPDATE jobs SET status = ? WHERE id = ?", status, id);
    }
}
