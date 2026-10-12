package com.escrowflow.config;

import com.escrowflow.model.User;
import com.escrowflow.model.UserProfile;
import com.escrowflow.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DatabaseInitConfig implements CommandLineRunner {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final BidRepository bidRepository;
    private final ContractRepository contractRepository;
    private final MilestoneRepository milestoneRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DatabaseInitConfig(UserRepository userRepository,
                              JobRepository jobRepository,
                              BidRepository bidRepository,
                              ContractRepository contractRepository,
                              MilestoneRepository milestoneRepository,
                              StatusHistoryRepository statusHistoryRepository,
                              TransactionRepository transactionRepository,
                              NotificationRepository notificationRepository,
                              PasswordEncoder passwordEncoder,
                              JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.bidRepository = bidRepository;
        this.contractRepository = contractRepository;
        this.milestoneRepository = milestoneRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.transactionRepository = transactionRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        // Only seed if users table is empty
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        if (count != null && count > 0) {
            return;
        }

        System.out.println(">>> EscrowFlow: Seeding initial demonstration data...");

        String encodedPassword = passwordEncoder.encode("password123");

        // 1. Seed Users
        User clientUser = new User(null, "client_corp", "client@escrowflow.com", encodedPassword, "CLIENT", null);
        clientUser = userRepository.createUser(clientUser);
        userRepository.createProfile(new UserProfile(null, clientUser.getId(), "Acme Corp (Client)", "Fintech company building milestone contracts", new BigDecimal("5000.00"), null));

        User freelancerUser = new User(null, "alex_dev", "freelancer@escrowflow.com", encodedPassword, "FREELANCER", null);
        freelancerUser = userRepository.createUser(freelancerUser);
        userRepository.createProfile(new UserProfile(null, freelancerUser.getId(), "Alex Dev (Freelancer)", "Full-stack engineer specializing in Spring Boot & React", new BigDecimal("1300.00"), null));

        User adminUser = new User(null, "gade_vinay", "admin@escrowflow.com", encodedPassword, "ADMIN", null);
        adminUser = userRepository.createUser(adminUser);
        userRepository.createProfile(new UserProfile(null, adminUser.getId(), "Gade Vinay (Admin)", "Platform Administrator, Anurag University CSE-P", BigDecimal.ZERO, null));

        // 2. Seed Job 1 (Contracted - matching Table 6 in Abstract)
        String job1Sql = "INSERT INTO jobs (client_id, title, description, category, budget, status) VALUES (?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(job1Sql, clientUser.getId(), "FinTech Mobile Application & Escrow Portal",
                "Complete design, frontend, and backend implementation for our milestone-based freelance portal.", "Fullstack Development", new BigDecimal("2500.00"), "CONTRACTED");
        Long job1Id = jdbcTemplate.queryForObject("SELECT id FROM jobs WHERE client_id = ? ORDER BY id DESC LIMIT 1", Long.class, clientUser.getId());

        // Bid for Job 1
        String bid1Sql = "INSERT INTO bids (job_id, freelancer_id, proposed_amount, proposed_timeline, proposal_text, status) VALUES (?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(bid1Sql, job1Id, freelancerUser.getId(), new BigDecimal("2500.00"), "30 days",
                "I will deliver high quality frontend and backend with complete test coverage and milestone tracking.", "ACCEPTED");

        // Contract for Job 1 ($2500 total, $1200 remaining in escrow because $1300 was already paid)
        String contractSql = "INSERT INTO contracts (job_id, client_id, freelancer_id, total_amount, escrow_balance, status) VALUES (?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(contractSql, job1Id, clientUser.getId(), freelancerUser.getId(), new BigDecimal("2500.00"), new BigDecimal("1200.00"), "ACTIVE");
        Long contract1Id = jdbcTemplate.queryForObject("SELECT id FROM contracts WHERE job_id = ? ORDER BY id DESC LIMIT 1", Long.class, job1Id);

        // Lock funds transaction
        transactionRepository.record(contract1Id, null, clientUser.getId(), null, new BigDecimal("2500.00"), "ESCROW_LOCK", "Initial escrow funding locked from client account");

        // 3. Seed Milestones directly matching Table 6 in project abstract
        // Milestone 1: Wireframes & UX Flow ($400, 5 days, PAID)
        String m1Sql = "INSERT INTO milestones (contract_id, title, description, amount, due_date_days, status, stated_note, deliverable_evidence, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(m1Sql, contract1Id, "Wireframes & UX Flow", "User journeys, Figma mockups, and interaction design", new BigDecimal("400.00"), 5, "PAID", "Approved and settled on schedule", "https://figma.com/file/escrowflow-design", 1);
        Long m1Id = jdbcTemplate.queryForObject("SELECT id FROM milestones WHERE contract_id = ? AND order_index = 1", Long.class, contract1Id);
        statusHistoryRepository.record(m1Id, "PENDING", "SUBMITTED", freelancerUser.getId(), "Figma prototype links submitted");
        statusHistoryRepository.record(m1Id, "SUBMITTED", "PAID", clientUser.getId(), "Approved and settled on schedule");
        transactionRepository.record(contract1Id, m1Id, clientUser.getId(), freelancerUser.getId(), new BigDecimal("400.00"), "RELEASE_PAYMENT", "Settled Wireframes & UX Flow");

        // Milestone 2: Frontend Implementation ($900, 12 days, PAID/ACCEPTED)
        jdbcTemplate.update(m1Sql, contract1Id, "Frontend Implementation", "React responsive dashboard, role gates, and live notification cards", new BigDecimal("900.00"), 12, "PAID", "Approved by client; payout confirmed", "https://github.com/gadevinay/escrowflow-fe", 2);
        Long m2Id = jdbcTemplate.queryForObject("SELECT id FROM milestones WHERE contract_id = ? AND order_index = 2", Long.class, contract1Id);
        statusHistoryRepository.record(m2Id, "PENDING", "SUBMITTED", freelancerUser.getId(), "Frontend repo branch merged");
        statusHistoryRepository.record(m2Id, "SUBMITTED", "PAID", clientUser.getId(), "Approved by client; payout confirmed");
        transactionRepository.record(contract1Id, m2Id, clientUser.getId(), freelancerUser.getId(), new BigDecimal("900.00"), "RELEASE_PAYMENT", "Settled Frontend Implementation");

        // Milestone 3: Backend API Integration ($850, 10 days, SUBMITTED - Ready for client approval/dispute in demo!)
        jdbcTemplate.update(m1Sql, contract1Id, "Backend API Integration", "Spring Boot REST controllers, Spring Security JWT filter, and JDBC repositories", new BigDecimal("850.00"), 10, "SUBMITTED", "Awaiting client review since submission", "Git pull request #14: Complete REST API integration and database schema", 3);
        Long m3Id = jdbcTemplate.queryForObject("SELECT id FROM milestones WHERE contract_id = ? AND order_index = 3", Long.class, contract1Id);
        statusHistoryRepository.record(m3Id, "PENDING", "SUBMITTED", freelancerUser.getId(), "Backend endpoints ready for client inspection");

        // Milestone 4: QA & Deployment ($350, 4 days, PENDING - Ready for freelancer submission in demo!)
        jdbcTemplate.update(m1Sql, contract1Id, "QA & Deployment", "End-to-end integration tests, cloud deployment packaging, and viva documentation", new BigDecimal("350.00"), 4, "PENDING", "Not yet started; contingent on prior milestone", null, 4);
        Long m4Id = jdbcTemplate.queryForObject("SELECT id FROM milestones WHERE contract_id = ? AND order_index = 4", Long.class, contract1Id);
        statusHistoryRepository.record(m4Id, "NONE", "PENDING", clientUser.getId(), "Created as contingent phase");

        // Seed notifications
        notificationRepository.create(clientUser.getId(), freelancerUser.getId(), contract1Id, m3Id, "Alex Dev submitted Backend API Integration for review ($850).");
        notificationRepository.create(freelancerUser.getId(), clientUser.getId(), contract1Id, m2Id, "Frontend Implementation ($900) approved and funds deposited to your balance.");

        // 4. Seed Job 2 (OPEN - for demonstrating job posting and bidding in demo!)
        jdbcTemplate.update(job1Sql, clientUser.getId(), "Cloud Microservices Migration & Dockerization",
                "Looking for a senior Java engineer to containerize existing services and deploy on Kubernetes.", "Cloud Architecture", new BigDecimal("1800.00"), "OPEN");
        Long job2Id = jdbcTemplate.queryForObject("SELECT id FROM jobs WHERE title LIKE 'Cloud Microservices%'", Long.class);

        // Freelancer bid on Job 2
        jdbcTemplate.update(bid1Sql, job2Id, freelancerUser.getId(), new BigDecimal("1750.00"), "14 days",
                "I have extensive experience with Spring Boot, Docker, and CI/CD pipelines. Can complete in 14 days.", "PENDING");

        System.out.println(">>> EscrowFlow: Seed data initialized successfully!");
    }
}
