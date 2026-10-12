package com.escrowflow.repository;

import com.escrowflow.model.Bid;
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
public class BidRepository {
    private final JdbcTemplate jdbcTemplate;

    public BidRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Bid> bidRowMapper = (rs, rowNum) -> {
        Bid bid = new Bid();
        bid.setId(rs.getLong("id"));
        bid.setJobId(rs.getLong("job_id"));
        bid.setJobTitle(rs.getString("job_title"));
        bid.setFreelancerId(rs.getLong("freelancer_id"));
        bid.setFreelancerName(rs.getString("freelancer_name"));
        bid.setProposedAmount(rs.getBigDecimal("proposed_amount"));
        bid.setProposedTimeline(rs.getString("proposed_timeline"));
        bid.setProposalText(rs.getString("proposal_text"));
        bid.setStatus(rs.getString("status"));
        bid.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : LocalDateTime.now());
        return bid;
    };

    public Bid create(Bid bid) {
        String sql = "INSERT INTO bids (job_id, freelancer_id, proposed_amount, proposed_timeline, proposal_text, status) VALUES (?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, bid.getJobId());
            ps.setLong(2, bid.getFreelancerId());
            ps.setBigDecimal(3, bid.getProposedAmount());
            ps.setString(4, bid.getProposedTimeline());
            ps.setString(5, bid.getProposalText());
            ps.setString(6, bid.getStatus() != null ? bid.getStatus() : "PENDING");
            return ps;
        }, keyHolder);

        if (keyHolder.getKeys() != null) {
            for (var entry : keyHolder.getKeys().entrySet()) {
                if ("id".equalsIgnoreCase(entry.getKey()) && entry.getValue() instanceof Number n) {
                    bid.setId(n.longValue());
                    break;
                }
            }
        } else if (keyHolder.getKey() != null) {
            bid.setId(keyHolder.getKey().longValue());
        }
        return bid;
    }

    public Optional<Bid> findById(Long id) {
        String sql = """
            SELECT b.*, j.title as job_title, u.username as freelancer_name
            FROM bids b
            JOIN jobs j ON b.job_id = j.id
            JOIN users u ON b.freelancer_id = u.id
            WHERE b.id = ?
        """;
        List<Bid> list = jdbcTemplate.query(sql, bidRowMapper, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<Bid> findByJobId(Long jobId) {
        String sql = """
            SELECT b.*, j.title as job_title, u.username as freelancer_name
            FROM bids b
            JOIN jobs j ON b.job_id = j.id
            JOIN users u ON b.freelancer_id = u.id
            WHERE b.job_id = ?
            ORDER BY b.proposed_amount ASC
        """;
        return jdbcTemplate.query(sql, bidRowMapper, jobId);
    }

    public List<Bid> findByFreelancerId(Long freelancerId) {
        String sql = """
            SELECT b.*, j.title as job_title, u.username as freelancer_name
            FROM bids b
            JOIN jobs j ON b.job_id = j.id
            JOIN users u ON b.freelancer_id = u.id
            WHERE b.freelancer_id = ?
            ORDER BY b.created_at DESC
        """;
        return jdbcTemplate.query(sql, bidRowMapper, freelancerId);
    }

    public void updateStatus(Long id, String status) {
        jdbcTemplate.update("UPDATE bids SET status = ? WHERE id = ?", status, id);
    }

    public void rejectOtherBidsForJob(Long jobId, Long acceptedBidId) {
        jdbcTemplate.update("UPDATE bids SET status = 'REJECTED' WHERE job_id = ? AND id != ?", jobId, acceptedBidId);
    }
}
