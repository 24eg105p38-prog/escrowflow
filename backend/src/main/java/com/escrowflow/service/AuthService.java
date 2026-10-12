package com.escrowflow.service;

import com.escrowflow.config.JwtTokenProvider;
import com.escrowflow.dto.AuthRequest;
import com.escrowflow.dto.AuthResponse;
import com.escrowflow.dto.RegisterRequest;
import com.escrowflow.model.User;
import com.escrowflow.model.UserProfile;
import com.escrowflow.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        UserProfile profile = userRepository.findProfileByUserId(user.getId())
                .orElse(new UserProfile(null, user.getId(), user.getUsername(), "", BigDecimal.ZERO, null));

        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole());

        return new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail(), user.getRole(),
                profile.getFullName(), profile.getMockBalance());
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email is already registered");
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username is already taken");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole().toUpperCase() : "CLIENT");
        user = userRepository.createUser(user);

        // Initial mock balance: Clients get $5000 to post jobs, Freelancers get $0
        BigDecimal startingBalance = "CLIENT".equalsIgnoreCase(user.getRole()) ? new BigDecimal("5000.00") : BigDecimal.ZERO;
        UserProfile profile = new UserProfile(null, user.getId(),
                request.getFullName() != null ? request.getFullName() : user.getUsername(),
                request.getBio() != null ? request.getBio() : "",
                startingBalance, null);
        userRepository.createProfile(profile);

        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole());

        return new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail(), user.getRole(),
                profile.getFullName(), profile.getMockBalance());
    }

    public AuthResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserProfile profile = userRepository.findProfileByUserId(userId)
                .orElse(new UserProfile(null, user.getId(), user.getUsername(), "", BigDecimal.ZERO, null));

        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole());
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail(), user.getRole(),
                profile.getFullName(), profile.getMockBalance());
    }
}
