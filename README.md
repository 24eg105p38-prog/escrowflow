# EscrowFlow — Milestone-Based Escrow Tracking Platform for Freelance Project Contracts

**Student Name:** Gade Vinay  
**Roll Number:** 24EG105P38  
**Branch:** CSE-P  
**Institution:** Anurag University  
**Tech Stack:** Java 21 • Spring Boot 3.2 • Spring Security + JWT • Spring JDBC (`JdbcTemplate`) • MySQL / H2 (MySQL Mode) • HTML5 / CSS3 / JavaScript / React.js

---

## 1. Project Overview & Abstract Refinement

Traditional freelance platforms treat a client–freelancer engagement as a single lump-sum transaction, leading to frequent disputes: clients fear paying before work is finished, and freelancers fear working without guaranteed compensation.

**EscrowFlow** solves this by decomposing freelance contracts into discrete, trackable **milestones**. Each milestone has:
1. Defined Scope & Stated Notes
2. Target Due Date (Timeline in Days)
3. Dedicated Escrow Fund Allocation ($ Amount)
4. State-Verified Fund Release Lifecycle (`PENDING` ➔ `SUBMITTED` ➔ `ACCEPTED` ➔ `PAID`)

### The Core Guiding Principle: State-Verified Fund Release
In EscrowFlow, funds committed to an escrow contract are **never moved by direct edits or balance mutations**. Funds are transferred **only** as the transactional consequence of a milestone transitioning from `SUBMITTED` to `ACCEPTED` under the method-level authority of the contract's own client. Every event (bid, submission, dispute, approval, transaction) is persisted as an immutable row in the database, allowing the entire financial state to be reconstructed from history.

---

## 2. System Architecture & Modules

### Layered Architecture
```
┌─────────────────────────────────────────────────────────────┐
│           Presentation Layer: HTML5, CSS3, JS & React       │
│     (Sidebar, Header, Milestone Cards, Bid Panel, Ledger)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│        Security Filter Chain: Spring Security 6 + JWT       │
│      (Stateless JWT Claims, Role & Contract Ownership Auth) │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                      REST API Controllers                   │
│   (/api/auth, /api/jobs, /api/milestones, /api/contracts)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│               Business Services & Transaction Layer         │
│     (MilestoneService, ContractService, NotificationService)│
│     [@Transactional ACID Enforced Status & Balance Update]  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│               Data Access Layer: Spring JdbcTemplate        │
│          (Parameterized SQL, RowMappers, Audit Logs)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    MySQL / H2 (MySQL Mode)                  │
│(users, profiles, jobs, bids, contracts, milestones, tx, etc)│
└─────────────────────────────────────────────────────────────┘
```

### Core Modules
1. **Identity & JWT Authentication Module:** BCrypt password encryption, stateless token generation containing `userId`, `username`, and `role` claims (`CLIENT`, `FREELANCER`, `ADMIN`).
2. **Job Board & Bidding Engine:** Clients create job listings with estimated budgets; freelancers submit competitive proposals; clients compare bids side by side.
3. **Milestone Contracting & Escrow Lock Module:** When a client accepts a bid, funds are automatically locked from the client's balance into contract escrow (`ESCROW_LOCK`), and binding milestone checkpoints are created.
4. **Milestone Status Engine:**
   - `PENDING ➔ SUBMITTED`: Assigned freelancer submits deliverable links/notes; alerts contract client.
   - `SUBMITTED ➔ PAID`: Contract-owning client approves work; executes atomic ACID transaction: decrements escrow balance, increments freelancer balance, writes transaction row, and records audit trail.
   - `SUBMITTED ➔ PENDING`: Client requests revisions with a **mandatory stated reason**; full history preserved in `status_history`.
5. **Reconstructable Escrow Ledger & Audit Trail:** Immutable table of all fund movements and lifecycle transitions.
6. **Event-Driven Alert System:** Generates notifications for each milestone event.
7. **Platform Administrator Oversight:** View platform integrity, all active contracts, and audit logs.

---

## 3. Database Schema Design (Table Relationships)

The relational schema is defined in `backend/src/main/resources/schema.sql`:

1. `users` & `user_profiles`: User identity, hashed passwords, roles (`CLIENT`, `FREELANCER`, `ADMIN`), and mock balances.
2. `jobs` (1-to-many with `bids`): Client-posted opportunities with categories and budgets.
3. `bids`: Freelancer proposals with amounts, timelines, and proposal text.
4. `contracts` (1-to-many with `milestones`): Binding contract between client and freelancer holding `total_amount` and `escrow_balance`.
5. `milestones`: Individual deliverables with title, scope, amount, due date, status, evidence, and dispute reasons.
6. `status_history`: Append-only audit log capturing every state transition (`fromStatus`, `toStatus`, `changedBy`, `reason`, `timestamp`).
7. `transactions`: Append-only financial ledger (`ESCROW_LOCK`, `RELEASE_PAYMENT`, `REFUND`).
8. `notifications`: Event-driven alerts with read/unread tracking.

---

## 4. Pre-Seeded Demonstration Accounts & Sample Data

The application comes pre-loaded with demonstration data matching **Table 6** of the project abstract:

| Role | Username | Email | Password | Starting Mock Balance |
| :--- | :--- | :--- | :--- | :--- |
| **Client** | `client_corp` | `client@escrowflow.com` | `password123` | **$5,000.00** |
| **Freelancer** | `alex_dev` | `freelancer@escrowflow.com` | `password123` | **$1,300.00** |
| **Admin** | `gade_vinay` | `admin@escrowflow.com` | `password123` | **$0.00** (Platform Auditor) |

### Table 6 Demonstrator Contract (#1: "FinTech Mobile Application & Escrow Portal")
- **Total Value:** $2,500.00 | **Escrow Balance:** $1,200.00
- **Milestone 1:** *Wireframes & UX Flow* — $400.00 — 5 Days — Status: **PAID** (Approved and settled on schedule)
- **Milestone 2:** *Frontend Implementation* — $900.00 — 12 Days — Status: **PAID** (Approved by client; payout confirmed)
- **Milestone 3:** *Backend API Integration* — $850.00 — 10 Days — Status: **SUBMITTED** (Ready for Client Approval or Dispute in demo!)
- **Milestone 4:** *QA & Deployment* — $350.00 — 4 Days — Status: **PENDING** (Ready for Freelancer deliverable submission in demo!)

---

## 5. Step-by-Step Local Setup & Execution Guide (Mac / VS Code / Terminal)

### Prerequisites
- **Java 21** (`java -version`)
- **Maven 3.8+** (`mvn -version`)
- **Web Browser** (Chrome / Safari / Firefox)

### Option A: One-Command Startup (Simplest)
Open Terminal in the project root:
```bash
cd /Users/gadevinay/.gemini/antigravity/scratch/escrowflow
./start.sh
```
*That's it!* Spring Boot will compile, load the database schema, seed Table 6 data, and serve the application at:
👉 **`http://localhost:8080/`**

### Option B: Running via Maven in Terminal or VS Code
```bash
cd /Users/gadevinay/.gemini/antigravity/scratch/escrowflow/backend
mvn spring-boot:run
```
Visit `http://localhost:8080/` in your browser.

### Option C: Connecting to External Local MySQL (Optional)
By default, EscrowFlow uses high-speed in-memory H2 with MySQL dialect so it runs out-of-the-box on any computer without requiring MySQL to be pre-installed or running.

If you wish to connect to an existing local MySQL server:
1. Create database:
   ```sql
   CREATE DATABASE escrowflow;
   ```
2. In `backend/src/main/resources/application.properties`, uncomment the MySQL lines:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/escrowflow?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
   spring.datasource.driverClassName=com.mysql.cj.jdbc.Driver
   spring.datasource.username=root
   spring.datasource.password=your_mysql_password
   ```
3. Run `mvn spring-boot:run`.

---

## 6. Testing the Core Workflows (Viva Demonstration Walkthrough)

### Scenario 1: State-Verified Fund Release (ACID Milestone Acceptance)
1. Open `http://localhost:8080/`
2. Select **Client: Acme Corp** from the top header demo switcher.
3. Observe KPI cards: Client has **$5,000.00** balance; Contract #1 has **$1,200.00** in Escrow.
4. On Milestone 3 (*Backend API Integration* — $850), click **"Approve & Release ($850)"**.
5. **Observe Instant Atomic Update:**
   - Milestone 3 transitions to **PAID**.
   - Escrow balance decrements to **$350.00**.
   - Switch role to **Freelancer: Alex Dev**: Balance has increased by $850 (from $1,300 to **$2,150.00**)!
   - Check the **Escrow Ledger & Audit** tab: A new immutable `RELEASE_PAYMENT` row appears in the MySQL ledger table with exact timestamp.

### Scenario 2: Freelancer Submission & Client Revision Request (Dispute Trail)
1. Switch role to **Freelancer: Alex Dev**.
2. Locate Milestone 4 (*QA & Deployment* — $350, Status: `PENDING`).
3. Click **"Submit Deliverable"**. Enter a GitHub pull request link and review notes, then submit.
4. Status transitions from `PENDING` ➔ `SUBMITTED`. Client receives an event alert.
5. Switch role to **Client: Acme Corp**.
6. On Milestone 4, click **"Request Revision"**. Enter mandatory stated reason: *"Please include load testing reports"*.
7. Status safely returns to `PENDING` with the stated reason recorded in red.
8. Click **"Audit Trail"**: Notice how every transition (`NONE ➔ PENDING ➔ SUBMITTED ➔ PENDING`) is preserved chronologically!

### Scenario 3: Bidding & Escrow Contract Formation
1. Go to the **Job Board & Bids** tab.
2. View the open job: *"Cloud Microservices Migration & Dockerization"* ($1,800).
3. As Freelancer, submit a proposal ($1,750, 14 days).
4. As Client, view proposals side-by-side and click **"Accept & Lock Escrow"**.
5. Funds are locked from the client's balance into escrow, and a new contract with milestone breakdowns is instantiated!

---

## 7. Cloud Deployment Guide (Free & Low-Cost)

The simplest, zero-cost deployment method for this Java + React project is **Render** (or **Railway**):

### Deploying to Render.com (Web Service)
1. Push this project folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of EscrowFlow"
   git remote add origin https://github.com/<your-username>/escrowflow.git
   git push -u origin main
   ```
2. Log in to [Render.com](https://render.com) and click **New + > Web Service**.
3. Select your GitHub repository.
4. Configure settings:
   - **Environment:** Java (or Docker)
   - **Root Directory:** `backend`
   - **Build Command:** `mvn clean package -DskipTests`
   - **Start Command:** `java -jar target/escrowflow-backend-1.0.0.jar`
   - **Plan:** Free Tier
5. Click **Deploy Web Service**.
6. Render will generate a live HTTPS URL (e.g. `https://escrowflow.onrender.com`) accessible from any browser or phone!

---

## 8. Viva Voce Preparation & Code Explanation Guide

### Q1: What is the core innovation of EscrowFlow?
> **Answer:** In traditional freelancing apps, balances are edited directly or paid lump-sum at the end. EscrowFlow implements **State-Verified Fund Release**: money committed to a contract can only move between mock balances as the transactional consequence of a milestone transitioning from `SUBMITTED` to `ACCEPTED` under the verified authority of the contract's client.

### Q2: How is security and authority enforced?
> **Answer:** We use **claims-based JWT authentication**. When a user logs in, Spring Security issues a signed token containing their user ID and role. At the method level in `MilestoneService`, we do not simply check if the caller is *a* client; we check if the caller's JWT `userId` matches the `clientId` stored on that specific contract record. This prevents unauthorized clients from approving milestones belonging to others.

### Q3: How do you guarantee ACID consistency during payment release?
> **Answer:** The method `MilestoneService.approveMilestone()` is annotated with `@Transactional`. Within that single database transaction:
> 1. Milestone status is updated to `PAID`.
> 2. Contract escrow balance is decremented.
> 3. Freelancer mock balance is incremented.
> 4. An immutable transaction row is inserted into the `transactions` table.
> 5. A transition event is inserted into the `status_history` table.
> 
> If any step fails (e.g. database error), Spring rolls back the entire transaction, ensuring balances and milestone statuses can never become inconsistent.

### Q4: Why did you use JdbcTemplate instead of JPA/Hibernate?
> **Answer:** `JdbcTemplate` provides explicit, parameterised SQL control without the overhead or lazy-loading surprises of an ORM. It enables direct row mapping, explicit transaction boundaries, and makes SQL queries transparent and auditable for academic presentation.

### Q5: What happens during a dispute or revision request?
> **Answer:** If a client is unsatisfied, they cannot reject work silently. The system requires a **mandatory stated reason**. The milestone moves from `SUBMITTED` back to `PENDING`, the reason is displayed to the freelancer, and an audit row is written to `status_history`. A milestone can cycle through review multiple times, preserving the entire negotiation trail.

---

## 9. Academic Project Metadata
- **Project Title:** EscrowFlow — Milestone-Based Escrow Tracking Platform for Freelance Project Contracts
- **Submitted by:** Gade Vinay
- **Roll Number:** 24EG105P38
- **Branch:** Computer Science and Engineering (CSE-P)
- **Institution:** Anurag University
