package com.escrowflow.repository;

import com.escrowflow.model.User;
import com.escrowflow.model.UserProfile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class UserRepository {
    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<User> userRowMapper = (rs, rowNum) -> new User(
            rs.getLong("id"),
            rs.getString("username"),
            rs.getString("email"),
            rs.getString("password_hash"),
            rs.getString("role"),
            rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : LocalDateTime.now()
    );

    private final RowMapper<UserProfile> profileRowMapper = (rs, rowNum) -> new UserProfile(
            rs.getLong("id"),
            rs.getLong("user_id"),
            rs.getString("full_name"),
            rs.getString("bio"),
            rs.getBigDecimal("mock_balance"),
            rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : LocalDateTime.now()
    );

    public Optional<User> findById(Long id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        List<User> list = jdbcTemplate.query(sql, userRowMapper, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<User> findByEmail(String email) {
        String sql = "SELECT * FROM users WHERE LOWER(email) = LOWER(?)";
        List<User> list = jdbcTemplate.query(sql, userRowMapper, email);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<User> findByUsername(String username) {
        String sql = "SELECT * FROM users WHERE LOWER(username) = LOWER(?)";
        List<User> list = jdbcTemplate.query(sql, userRowMapper, username);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public User createUser(User user) {
        String sql = "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, user.getUsername());
            ps.setString(2, user.getEmail());
            ps.setString(3, user.getPasswordHash());
            ps.setString(4, user.getRole());
            return ps;
        }, keyHolder);

        if (keyHolder.getKeys() != null) {
            for (var entry : keyHolder.getKeys().entrySet()) {
                if ("id".equalsIgnoreCase(entry.getKey()) && entry.getValue() instanceof Number n) {
                    user.setId(n.longValue());
                    break;
                }
            }
        } else if (keyHolder.getKey() != null) {
            user.setId(keyHolder.getKey().longValue());
        }
        return user;
    }

    public void createProfile(UserProfile profile) {
        String sql = "INSERT INTO user_profiles (user_id, full_name, bio, mock_balance) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql, profile.getUserId(), profile.getFullName(), profile.getBio(), profile.getMockBalance());
    }

    public Optional<UserProfile> findProfileByUserId(Long userId) {
        String sql = "SELECT * FROM user_profiles WHERE user_id = ?";
        List<UserProfile> list = jdbcTemplate.query(sql, profileRowMapper, userId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public void updateMockBalance(Long userId, BigDecimal newBalance) {
        String sql = "UPDATE user_profiles SET mock_balance = ? WHERE user_id = ?";
        jdbcTemplate.update(sql, newBalance, userId);
    }

    public void addToMockBalance(Long userId, BigDecimal delta) {
        String sql = "UPDATE user_profiles SET mock_balance = mock_balance + ? WHERE user_id = ?";
        jdbcTemplate.update(sql, delta, userId);
    }

    public List<User> findAll() {
        return jdbcTemplate.query("SELECT * FROM users ORDER BY id ASC", userRowMapper);
    }
}
