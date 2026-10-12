-- ==============================================================================
-- EscrowFlow - Full Relational Database Schema & Demonstration Seed Data
-- Author: Gade Vinay | Roll: 24EG105P38 | Anurag University (CSE-P)
-- Database Target: MySQL 8.0+ / MariaDB / H2
-- ==============================================================================

DROP DATABASE IF EXISTS escrowflow;
CREATE DATABASE escrowflow;
USE escrowflow;

-- 1. Identity & Profile Tables
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    bio TEXT,
    mock_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Job Postings & Bidding Tables
CREATE TABLE jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    budget DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_job_client FOREIGN KEY (client_id) REFERENCES users(id)
);

CREATE TABLE bids (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT NOT NULL,
    freelancer_id BIGINT NOT NULL,
    proposed_amount DECIMAL(15, 2) NOT NULL,
    proposed_timeline VARCHAR(100) NOT NULL,
    proposal_text TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bid_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_bid_freelancer FOREIGN KEY (freelancer_id) REFERENCES users(id)
);

-- 3. Contracts & Milestones
CREATE TABLE contracts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    freelancer_id BIGINT NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    escrow_balance DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contract_job FOREIGN KEY (job_id) REFERENCES jobs(id),
    CONSTRAINT fk_contract_client FOREIGN KEY (client_id) REFERENCES users(id),
    CONSTRAINT fk_contract_freelancer FOREIGN KEY (freelancer_id) REFERENCES users(id)
);

CREATE TABLE milestones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contract_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    due_date_days INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    stated_note TEXT,
    deliverable_evidence TEXT,
    dispute_reason TEXT,
    order_index INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_milestone_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

-- 4. Status History & Transaction Ledger Tables
CREATE TABLE status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    milestone_id BIGINT NOT NULL,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    changed_by_user_id BIGINT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_milestone FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
);

CREATE TABLE transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contract_id BIGINT NOT NULL,
    milestone_id BIGINT,
    from_user_id BIGINT,
    to_user_id BIGINT,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tx_contract FOREIGN KEY (contract_id) REFERENCES contracts(id),
    CONSTRAINT fk_tx_milestone FOREIGN KEY (milestone_id) REFERENCES milestones(id)
);

CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    actor_id BIGINT,
    contract_id BIGINT,
    milestone_id BIGINT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==============================================================================
-- DEMONSTRATION SEED DATA (Matching Table 6 in Project Abstract)
-- ==============================================================================

-- 1. Users (Passwords hashed with BCrypt for 'password123')
INSERT INTO users (id, username, email, password_hash, role) VALUES
(1, 'client_corp', 'client@escrowflow.com', '$2a$10$qSV4xz5dcgic1CtCabdzqupxYw0ADTq0q/43uXwJAJYn/09ogEj1C', 'CLIENT'),
(2, 'alex_dev', 'freelancer@escrowflow.com', '$2a$10$qSV4xz5dcgic1CtCabdzqupxYw0ADTq0q/43uXwJAJYn/09ogEj1C', 'FREELANCER'),
(3, 'gade_vinay', 'admin@escrowflow.com', '$2a$10$qSV4xz5dcgic1CtCabdzqupxYw0ADTq0q/43uXwJAJYn/09ogEj1C', 'ADMIN');

INSERT INTO user_profiles (user_id, full_name, bio, mock_balance) VALUES
(1, 'Acme Corp (Client)', 'Fintech client company managing freelance contracts', 5000.00),
(2, 'Alex Dev (Freelancer)', 'Fullstack Spring Boot & React Specialist', 1300.00),
(3, 'Gade Vinay (Admin)', 'Platform Auditor • Anurag University CSE-P', 0.00);

-- 2. Job 1 & Accepted Bid
INSERT INTO jobs (id, client_id, title, description, category, budget, status) VALUES
(1, 1, 'FinTech Mobile Application & Escrow Portal', 'Fullstack design and backend implementation of a milestone contract tracking system.', 'Fullstack Development', 2500.00, 'CONTRACTED');

INSERT INTO bids (id, job_id, freelancer_id, proposed_amount, proposed_timeline, proposal_text, status) VALUES
(1, 1, 2, 2500.00, '30 days', 'I can build this system with clean Spring Boot architecture, JWT security, and React.', 'ACCEPTED');

-- 3. Contract 1 & Escrow Lock Transaction
INSERT INTO contracts (id, job_id, client_id, freelancer_id, total_amount, escrow_balance, status) VALUES
(1, 1, 1, 2, 2500.00, 1200.00, 'ACTIVE');

INSERT INTO transactions (id, contract_id, milestone_id, from_user_id, to_user_id, amount, transaction_type, description) VALUES
(1, 1, NULL, 1, NULL, 2500.00, 'ESCROW_LOCK', 'Initial escrow funding locked from client account');

-- 4. Milestones Matching Table 6 in Abstract
INSERT INTO milestones (id, contract_id, title, description, amount, due_date_days, status, stated_note, deliverable_evidence, order_index) VALUES
(1, 1, 'Wireframes & UX Flow', 'User journeys, Figma mockups, and interaction design', 400.00, 5, 'PAID', 'Approved and settled on schedule', 'https://figma.com/file/escrowflow-design', 1),
(2, 1, 'Frontend Implementation', 'React responsive dashboard, role gates, and live notification cards', 900.00, 12, 'PAID', 'Approved by client; payout confirmed', 'https://github.com/gadevinay/escrowflow-fe', 2),
(3, 1, 'Backend API Integration', 'Spring Boot REST controllers, Spring Security JWT filter, and JDBC repositories', 850.00, 10, 'SUBMITTED', 'Awaiting client review since submission', 'Git PR #14: Complete REST API integration and database schema', 3),
(4, 1, 'QA & Deployment', 'End-to-end integration tests, cloud deployment packaging, and viva documentation', 350.00, 4, 'PENDING', 'Not yet started; contingent on prior milestone', NULL, 4);

-- 5. Prior Milestone Settlement Transactions
INSERT INTO transactions (id, contract_id, milestone_id, from_user_id, to_user_id, amount, transaction_type, description) VALUES
(2, 1, 1, 1, 2, 400.00, 'RELEASE_PAYMENT', 'Settled Wireframes & UX Flow'),
(3, 1, 2, 1, 2, 900.00, 'RELEASE_PAYMENT', 'Settled Frontend Implementation');

-- 6. Status History Audit Trail
INSERT INTO status_history (milestone_id, from_status, to_status, changed_by_user_id, reason) VALUES
(1, 'PENDING', 'SUBMITTED', 2, 'Figma prototype links submitted'),
(1, 'SUBMITTED', 'PAID', 1, 'Approved and settled on schedule'),
(2, 'PENDING', 'SUBMITTED', 2, 'Frontend repo branch merged'),
(2, 'SUBMITTED', 'PAID', 1, 'Approved by client; payout confirmed'),
(3, 'PENDING', 'SUBMITTED', 2, 'Backend endpoints ready for client inspection'),
(4, 'NONE', 'PENDING', 1, 'Created as contingent phase');

-- 7. Job 2 (Open Marketplace Listing)
INSERT INTO jobs (id, client_id, title, description, category, budget, status) VALUES
(2, 1, 'Cloud Microservices Migration & Dockerization', 'Looking for senior engineer to containerize existing services and deploy on Kubernetes.', 'Cloud Architecture', 1800.00, 'OPEN');

INSERT INTO bids (id, job_id, freelancer_id, proposed_amount, proposed_timeline, proposal_text, status) VALUES
(2, 2, 2, 1750.00, '14 days', 'Extensive experience in Spring Boot and Docker. Can deliver within 14 days.', 'PENDING');
