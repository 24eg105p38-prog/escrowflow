// EscrowFlow - Core Client Logic
// Authored for Gade Vinay, Roll: 24EG105P38, Anurag University

const API_BASE = '/api';

const app = {
    currentUser: null,
    token: null,
    activeTab: 'milestones',
    activeContractId: 1,

    demoAccounts: {
        'client@escrowflow.com': 'password123',
        'freelancer@escrowflow.com': 'password123',
        'admin@escrowflow.com': 'password123'
    },

    async init() {
        this.setupNavigation();
        this.setupRoleSwitcher();
        // Login default client on startup
        await this.login('client@escrowflow.com', 'password123');
        this.startNotificationPoller();
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });
    },

    switchTab(tabId) {
        this.activeTab = tabId;
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });

        document.querySelectorAll('.tab-content').forEach(section => {
            section.classList.toggle('active', section.id === `tab-${tabId}`);
        });

        const titles = {
            'milestones': 'Contracts & Milestones',
            'jobs': 'Job Board & Proposals',
            'ledger': 'Escrow Ledger & Audit Trail',
            'notifications': 'Alerts & Notifications',
            'admin': 'Platform Integrity (Admin Oversight)'
        };
        const subtitles = {
            'milestones': 'Real-time checkpoint verification and fund escrow tracking',
            'jobs': 'Bidding engine, client job postings, and side-by-side proposal comparison',
            'ledger': 'ACID-compliant immutable financial transactions and status transition history',
            'notifications': 'Event-driven real-time alert logs for submissions, approvals and disputes',
            'admin': 'Platform-wide contracts oversight, dispute escalation, and fund integrity auditing'
        };

        document.getElementById('page-title').innerText = titles[tabId] || 'EscrowFlow';
        document.getElementById('page-subtitle').innerText = subtitles[tabId] || '';

        this.refreshCurrentTab();
    },

    setupRoleSwitcher() {
        const selector = document.getElementById('role-selector');
        selector.addEventListener('change', async (e) => {
            const email = e.target.value;
            const password = this.demoAccounts[email] || 'password123';
            await this.login(email, password);
        });
    },

    async login(email, password) {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                const err = await res.json();
                this.showToast(err.error || 'Login failed', 'error');
                return;
            }

            const data = await res.json();
            this.token = data.token;
            this.currentUser = data;

            this.updateHeaderProfile();
            this.showToast(`Logged in as ${data.fullName} (${data.role})`, 'success');
            this.refreshCurrentTab();
            this.fetchNotifications();
            this.closeModal('modal-auth');
        } catch (err) {
            console.error('Login error:', err);
            this.showToast('Failed to authenticate with server', 'error');
        }
    },

    logout() {
        this.token = null;
        this.currentUser = null;
        this.updateHeaderProfile();
        this.showToast('You have been logged out successfully.', 'info');
        this.refreshCurrentTab();
    },

    openAuthModal() {
        this.openModal('modal-auth');
    },

    switchAuthMode(mode) {
        const isLogin = mode === 'login';
        document.getElementById('tab-auth-login').classList.toggle('active', isLogin);
        document.getElementById('tab-auth-register').classList.toggle('active', !isLogin);
        document.getElementById('form-login').classList.toggle('hidden', !isLogin);
        document.getElementById('form-register').classList.toggle('hidden', isLogin);
        document.getElementById('auth-modal-title').innerText = isLogin ? 'Log In to EscrowFlow' : 'Create an Account';
    },

    async submitLogin() {
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        if (!email || !pass) {
            this.showToast('Please enter both email and password', 'error');
            return;
        }
        await this.login(email, pass);
    },

    async submitRegister() {
        const fullName = document.getElementById('reg-fullname').value;
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;

        if (!fullName || !username || !email || !password) {
            this.showToast('Please fill all registration fields', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, username, email, password, role })
            });

            if (!res.ok) {
                const err = await res.json();
                this.showToast(err.error || 'Registration failed', 'error');
                return;
            }

            const data = await res.json();
            this.token = data.token;
            this.currentUser = data;
            this.updateHeaderProfile();
            this.showToast(`Account created! Welcome, ${data.fullName}`, 'success');
            this.refreshCurrentTab();
            this.fetchNotifications();
            this.closeModal('modal-auth');
        } catch (e) {
            this.showToast('Failed to register account', 'error');
        }
    },

    async quickDemo(email) {
        const pass = this.demoAccounts[email] || 'password123';
        await this.login(email, pass);
    },

    updateHeaderProfile() {
        const roleSelector = document.getElementById('role-selector')?.parentElement;
        const userPill = document.querySelector('.user-pill');
        const balanceCard = document.getElementById('balance-card-box');
        const logoutBtn = document.getElementById('btn-logout');
        const loginTrigger = document.getElementById('btn-login-trigger');

        if (!this.currentUser) {
            if (roleSelector) roleSelector.style.display = 'none';
            if (userPill) userPill.style.display = 'none';
            if (balanceCard) balanceCard.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (loginTrigger) loginTrigger.classList.remove('hidden');
            return;
        }

        if (roleSelector) roleSelector.style.display = 'flex';
        if (userPill) userPill.style.display = 'flex';
        if (balanceCard) balanceCard.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        if (loginTrigger) loginTrigger.classList.add('hidden');

        document.getElementById('user-name').innerText = this.currentUser.fullName || this.currentUser.username;
        document.getElementById('user-avatar').innerText = (this.currentUser.username || 'U')[0].toUpperCase();

        const roleBadge = document.getElementById('user-role-badge');
        roleBadge.innerText = this.currentUser.role;
        roleBadge.className = `user-role-badge badge-${this.currentUser.role.toLowerCase()}`;

        document.getElementById('user-balance').innerText = `$${Number(this.currentUser.mockBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        // Update role action hint
        const hint = document.getElementById('role-action-hint');
        if (hint) {
            if (this.currentUser.role === 'CLIENT') {
                hint.innerHTML = '<strong>Client Mode:</strong> You have the exclusive authority to Approve deliverables (releases funds) or Request revisions.';
            } else if (this.currentUser.role === 'FREELANCER') {
                hint.innerHTML = '<strong>Freelancer Mode:</strong> Submit deliverables with URL/proof for pending milestones. Payments are released upon client acceptance.';
            } else {
                hint.innerHTML = '<strong>Admin Mode:</strong> Oversight and platform audit access enabled.';
            }
        }

        // Hide/show post job button based on role
        const postJobBtn = document.getElementById('btn-post-job-modal');
        if (postJobBtn) {
            postJobBtn.style.display = this.currentUser.role === 'CLIENT' ? 'inline-flex' : 'none';
        }
    },

    async refreshProfileBalance() {
        if (!this.token) return;
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                this.currentUser.mockBalance = data.mockBalance;
                document.getElementById('user-balance').innerText = `$${Number(data.mockBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            }
        } catch (e) {}
    },

    async refreshCurrentTab() {
        if (this.activeTab === 'milestones') {
            await this.loadMilestonesView();
        } else if (this.activeTab === 'jobs') {
            await this.loadJobsView();
        } else if (this.activeTab === 'ledger') {
            await this.loadLedgerView();
        } else if (this.activeTab === 'notifications') {
            await this.loadNotificationsView();
        } else if (this.activeTab === 'admin') {
            await this.loadAdminView();
        }
    },

    // -------------------------------------------------------------
    // TAB 1: MILESTONES & CONTRACTS
    // -------------------------------------------------------------
    async loadMilestonesView() {
        try {
            const res = await fetch(`${API_BASE}/contracts/1`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!res.ok) {
                // If contract #1 not accessible, fetch user's first available contract
                const listRes = await fetch(`${API_BASE}/contracts`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                if (listRes.ok) {
                    const list = await listRes.json();
                    if (list.length > 0) {
                        this.activeContractId = list[0].id;
                        return this.loadMilestonesView();
                    }
                }
                return;
            }

            const data = await res.json();
            const contract = data.contract;
            const milestones = data.milestones || [];

            // Update Contract Banner
            document.getElementById('contract-title').innerText = contract.jobTitle || 'Contract #' + contract.id;
            document.getElementById('contract-client').innerText = contract.clientName || 'Client';
            document.getElementById('contract-freelancer').innerText = contract.freelancerName || 'Freelancer';
            document.getElementById('contract-total').innerText = `$${Number(contract.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            document.getElementById('contract-escrow-balance').innerText = `$${Number(contract.escrowBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

            // Update KPIs
            document.getElementById('kpi-escrow').innerText = `$${Number(contract.escrowBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            const releasedAmount = Number(contract.totalAmount) - Number(contract.escrowBalance);
            document.getElementById('kpi-released').innerText = `$${releasedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            document.getElementById('kpi-active-milestones').innerText = `${milestones.length} Milestones`;
            document.getElementById('kpi-contract-status').innerText = `${contract.status} (#${contract.id})`;

            // Render Milestones (Table 6 breakdown)
            const container = document.getElementById('milestones-container');
            container.innerHTML = '';

            milestones.forEach((m, idx) => {
                const card = document.createElement('div');
                card.className = 'milestone-card';

                const statusClass = m.status.toLowerCase();

                let actionButtons = '';
                const isContractClient = this.currentUser && this.currentUser.id === contract.clientId;
                const isContractFreelancer = this.currentUser && this.currentUser.id === contract.freelancerId;

                if (m.status === 'PENDING') {
                    if (isContractFreelancer) {
                        actionButtons = `<button class="btn btn-primary btn-sm" onclick="app.openSubmitModal(${m.id})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            Submit Deliverable
                        </button>`;
                    } else {
                        actionButtons = `<span class="badge-neutral">Awaiting Freelancer Work</span>`;
                    }
                } else if (m.status === 'SUBMITTED') {
                    if (isContractClient) {
                        actionButtons = `
                            <button class="btn btn-success btn-sm" onclick="app.approveMilestone(${m.id})">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                                Approve & Release ($${m.amount})
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="app.openDisputeModal(${m.id})">
                                Request Revision
                            </button>
                        `;
                    } else {
                        actionButtons = `<span class="badge-neutral" style="color: #60a5fa;">Awaiting Client Approval</span>`;
                    }
                } else if (m.status === 'ACCEPTED' || m.status === 'PAID') {
                    actionButtons = `<span class="text-emerald" style="font-size: 0.85rem; font-weight: 600;">✓ Settled & Paid</span>`;
                }

                let evidenceHtml = '';
                if (m.deliverableEvidence) {
                    evidenceHtml = `
                        <div class="milestone-evidence-box">
                            <span class="evidence-label">Submitted Deliverable Evidence:</span>
                            <div class="evidence-text">${m.deliverableEvidence}</div>
                        </div>
                    `;
                }

                let disputeHtml = '';
                if (m.disputeReason) {
                    disputeHtml = `
                        <div class="dispute-box">
                            <span class="dispute-label">Client Revision Request:</span>
                            <div class="dispute-text">${m.disputeReason}</div>
                        </div>
                    `;
                }

                card.innerHTML = `
                    <div>
                        <div class="milestone-header">
                            <div>
                                <span class="milestone-order">Milestone #${m.orderIndex || (idx + 1)}</span>
                                <h4>${m.title}</h4>
                            </div>
                            <span class="status-badge ${statusClass}">${m.status}</span>
                        </div>
                        <p class="milestone-desc">${m.description || 'Deliverable checkpoint for contract settlement.'}</p>
                        
                        <div class="milestone-financial-bar">
                            <div><span>Checkpoint Amount:</span> <strong>$${Number(m.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>
                            <div><span>Target Timeline:</span> <strong>${m.dueDateDays} Days</strong></div>
                        </div>

                        ${evidenceHtml}
                        ${disputeHtml}

                        ${m.statedNote ? `<div style="font-size: 0.78rem; color: #94a3b8; margin-bottom: 12px; font-style: italic;">Note: ${m.statedNote}</div>` : ''}
                    </div>

                    <div class="milestone-card-footer">
                        <button class="btn btn-secondary btn-sm" onclick="app.showMilestoneAudit(${m.id}, '${m.title.replace(/'/g, "\\'")}')">Audit Trail</button>
                        <div class="btn-group">
                            ${actionButtons}
                        </div>
                    </div>
                `;

                container.appendChild(card);
            });

            this.refreshProfileBalance();
        } catch (err) {
            console.error('Error loading milestones:', err);
        }
    },

    openSubmitModal(milestoneId) {
        document.getElementById('submit-milestone-id').value = milestoneId;
        document.getElementById('submit-evidence-input').value = '';
        document.getElementById('submit-notes-input').value = '';
        document.getElementById('modal-submit').classList.remove('hidden');
    },

    async executeSubmitDeliverable() {
        const id = document.getElementById('submit-milestone-id').value;
        const evidence = document.getElementById('submit-evidence-input').value.trim();
        const note = document.getElementById('submit-notes-input').value.trim();

        if (!evidence) {
            this.showToast('Please provide verifiable deliverable evidence link or text', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/milestones/${id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ evidence, note })
            });

            if (!res.ok) {
                const err = await res.json();
                this.showToast(err.error || 'Submission failed', 'error');
                return;
            }

            this.closeModal('modal-submit');
            this.showToast('Deliverable submitted successfully! Client notified for review.', 'success');
            await this.loadMilestonesView();
            this.fetchNotifications();
        } catch (e) {
            this.showToast('Network error during submission', 'error');
        }
    },

    async approveMilestone(milestoneId) {
        if (!confirm('Execute state-verified fund release? Funds will move from Escrow to Freelancer in an ACID transaction.')) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/milestones/${milestoneId}/approve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!res.ok) {
                const err = await res.json();
                this.showToast(err.error || 'Approval failed', 'error');
                return;
            }

            this.showToast('Milestone APPROVED! ACID fund release recorded in MySQL ledger.', 'success');
            await this.loadMilestonesView();
            this.refreshProfileBalance();
            this.fetchNotifications();
        } catch (e) {
            this.showToast('Network error during milestone approval', 'error');
        }
    },

    openDisputeModal(milestoneId) {
        document.getElementById('dispute-milestone-id').value = milestoneId;
        document.getElementById('dispute-reason-input').value = '';
        document.getElementById('modal-dispute').classList.remove('hidden');
    },

    async executeDisputeMilestone() {
        const id = document.getElementById('dispute-milestone-id').value;
        const reason = document.getElementById('dispute-reason-input').value.trim();

        if (!reason) {
            this.showToast('Mandatory stated reason is required to dispute or request revision', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/milestones/${id}/dispute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ reason })
            });

            if (!res.ok) {
                const err = await res.json();
                this.showToast(err.error || 'Revision request failed', 'error');
                return;
            }

            this.closeModal('modal-dispute');
            this.showToast('Milestone returned to PENDING with recorded dispute reason.', 'info');
            await this.loadMilestonesView();
            this.fetchNotifications();
        } catch (e) {
            this.showToast('Network error during revision request', 'error');
        }
    },

    async showMilestoneAudit(milestoneId, title) {
        try {
            const res = await fetch(`${API_BASE}/milestones/${milestoneId}/history`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!res.ok) return;

            const history = await res.json();
            document.getElementById('modal-audit-title').innerText = `Audit Trail: ${title}`;
            const container = document.getElementById('audit-timeline-container');
            container.innerHTML = '';

            if (history.length === 0) {
                container.innerHTML = '<p style="color: #94a3b8;">No status transitions recorded yet.</p>';
            } else {
                history.forEach(h => {
                    const item = document.createElement('div');
                    item.className = 'timeline-event';
                    item.innerHTML = `
                        <div class="event-header">
                            <span class="event-transition">${h.fromStatus} ➔ ${h.toStatus}</span>
                            <span class="event-user">by <strong>${h.changedByUsername}</strong> (${h.changedByRole})</span>
                        </div>
                        <div class="event-reason">${h.reason || 'Status transition event recorded'}</div>
                        <div class="event-time">${h.createdAt ? h.createdAt.replace('T', ' ') : ''}</div>
                    `;
                    container.appendChild(item);
                });
            }

            document.getElementById('modal-audit').classList.remove('hidden');
        } catch (e) {}
    },

    // -------------------------------------------------------------
    // TAB 2: JOB BOARD & PROPOSALS
    // -------------------------------------------------------------
    async loadJobsView() {
        try {
            const res = await fetch(`${API_BASE}/jobs`);
            if (!res.ok) return;

            const jobs = await res.json();
            const container = document.getElementById('jobs-container');
            container.innerHTML = '';

            for (const job of jobs) {
                // Fetch bids for this job
                let bids = [];
                try {
                    const bidRes = await fetch(`${API_BASE}/jobs/${job.id}/bids`, {
                        headers: { 'Authorization': `Bearer ${this.token}` }
                    });
                    if (bidRes.ok) {
                        bids = await bidRes.json();
                    }
                } catch (e) {}

                const card = document.createElement('div');
                card.className = 'job-card';

                let actionHtml = '';
                if (this.currentUser && this.currentUser.role === 'FREELANCER' && job.status === 'OPEN') {
                    actionHtml = `<button class="btn btn-primary" onclick="app.openPlaceBidModal(${job.id}, '${job.title.replace(/'/g, "\\'")}')">
                        Submit Proposal / Bid
                    </button>`;
                }

                let bidsListHtml = '';
                if (bids.length > 0) {
                    bidsListHtml = `
                        <div class="bids-section">
                            <div class="bids-header">
                                <h5>Proposals Received (${bids.length})</h5>
                                <small style="color: #94a3b8;">Side-by-Side Comparison</small>
                            </div>
                            <div class="bids-list">
                                ${bids.map(b => `
                                    <div class="bid-item">
                                        <div class="bid-freelancer-info">
                                            <strong>${b.freelancerName}</strong>
                                            <div class="bid-proposal-text">"${b.proposalText}"</div>
                                        </div>
                                        <div class="bid-terms">
                                            <div>
                                                <div class="bid-amount">$${Number(b.proposedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                                <div class="bid-timeline">⏱ ${b.proposedTimeline}</div>
                                            </div>
                                            ${(this.currentUser && this.currentUser.id === job.clientId && b.status === 'PENDING') ? `
                                                <button class="btn btn-success btn-sm" onclick="app.acceptBid(${job.id}, ${b.id})">
                                                    Accept & Lock Escrow
                                                </button>
                                            ` : `<span class="status-badge ${b.status.toLowerCase()}">${b.status}</span>`}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }

                card.innerHTML = `
                    <div class="job-header-row">
                        <div>
                            <span class="job-category-tag">${job.category || 'Software'}</span>
                            <h4>${job.title}</h4>
                        </div>
                        <div class="job-budget">$${Number(job.budget).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <p class="job-desc">${job.description}</p>
                    <div class="job-meta-row">
                        <span>Posted by: <strong>${job.clientName}</strong></span>
                        <span>Status: <strong class="${job.status === 'OPEN' ? 'text-emerald' : ''}">${job.status}</strong></span>
                        <span>Bids: <strong>${bids.length}</strong></span>
                    </div>

                    ${actionHtml}
                    ${bidsListHtml}
                `;

                container.appendChild(card);
            }
        } catch (err) {
            console.error('Error loading jobs:', err);
        }
    },

    openPostJobModal() {
        document.getElementById('job-title-input').value = '';
        document.getElementById('job-budget-input').value = '';
        document.getElementById('job-desc-input').value = '';
        document.getElementById('modal-post-job').classList.remove('hidden');
    },

    async executePostJob() {
        const title = document.getElementById('job-title-input').value.trim();
        const budget = document.getElementById('job-budget-input').value.trim();
        const category = document.getElementById('job-category-input').value;
        const description = document.getElementById('job-desc-input').value.trim();

        if (!title || !budget || !description) {
            this.showToast('Please fill out all job details', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ title, budget: Number(budget), category, description })
            });

            if (!res.ok) {
                const err = await res.json();
                this.showToast(err.error || 'Failed to post job', 'error');
                return;
            }

            this.closeModal('modal-post-job');
            this.showToast('Job listing published to the marketplace!', 'success');
            await this.loadJobsView();
        } catch (e) {
            this.showToast('Network error while posting job', 'error');
        }
    },

    openPlaceBidModal(jobId, jobTitle) {
        document.getElementById('bid-job-id').value = jobId;
        document.getElementById('bid-amount-input').value = '';
        document.getElementById('bid-timeline-input').value = '';
        document.getElementById('bid-pitch-input').value = '';
        document.getElementById('modal-place-bid').classList.remove('hidden');
    },

    async executeSubmitBid() {
        const jobId = document.getElementById('bid-job-id').value;
        const proposedAmount = document.getElementById('bid-amount-input').value.trim();
        const proposedTimeline = document.getElementById('bid-timeline-input').value.trim();
        const proposalText = document.getElementById('bid-pitch-input').value.trim();

        if (!proposedAmount || !proposedTimeline || !proposalText) {
            this.showToast('Please provide all bid terms and proposal pitch', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/jobs/${jobId}/bids`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ proposedAmount: Number(proposedAmount), proposedTimeline, proposalText })
            });

            if (!res.ok) {
                const err = await res.json();
                this.showToast(err.error || 'Failed to submit bid', 'error');
                return;
            }

            this.closeModal('modal-place-bid');
            this.showToast('Bid proposal submitted! Client notified.', 'success');
            await this.loadJobsView();
            this.fetchNotifications();
        } catch (e) {
            this.showToast('Network error while submitting proposal', 'error');
        }
    },

    async acceptBid(jobId, bidId) {
        if (!confirm('Accept this proposal? Funds will be locked from your client wallet into Escrow, and an enforceable milestone contract will be created.')) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/jobs/${jobId}/bids/${bidId}/accept`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!res.ok) {
                const err = await res.json();
                this.showToast(err.error || 'Failed to accept bid', 'error');
                return;
            }

            const contract = await res.json();
            this.activeContractId = contract.id;
            this.showToast(`Bid accepted! Contract #${contract.id} formed with escrow funds locked.`, 'success');
            this.switchTab('milestones');
        } catch (e) {
            this.showToast('Network error while accepting bid', 'error');
        }
    },

    // -------------------------------------------------------------
    // TAB 3: ESCROW LEDGER & AUDIT TRAIL
    // -------------------------------------------------------------
    async loadLedgerView() {
        try {
            const res = await fetch(`${API_BASE}/contracts/1/ledger`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!res.ok) return;

            const data = await res.json();
            const txs = data.transactions || [];
            const history = data.statusHistory || [];

            // Transactions Table
            const txBody = document.getElementById('transactions-table-body');
            txBody.innerHTML = '';
            if (txs.length === 0) {
                txBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #94a3b8;">No financial transactions recorded yet.</td></tr>';
            } else {
                txs.forEach(t => {
                    const tr = document.createElement('tr');
                    const isRelease = t.transactionType === 'RELEASE_PAYMENT';
                    tr.innerHTML = `
                        <td><strong>#TX-${t.id}</strong></td>
                        <td><span class="status-badge ${isRelease ? 'paid' : 'pending'}">${t.transactionType}</span></td>
                        <td>${t.milestoneTitle || 'Contract Activation'}</td>
                        <td>${t.fromUserName || 'Client'}</td>
                        <td>${t.toUserName || 'Escrow Vault'}</td>
                        <td class="${isRelease ? 'text-emerald' : 'text-bold'}">$${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td>${t.description}</td>
                        <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;">${t.createdAt ? t.createdAt.replace('T', ' ') : ''}</td>
                    `;
                    txBody.appendChild(tr);
                });
            }

            // Status History Table
            const histBody = document.getElementById('history-table-body');
            histBody.innerHTML = '';
            if (history.length === 0) {
                histBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #94a3b8;">No status transitions recorded yet.</td></tr>';
            } else {
                history.forEach(h => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>#${h.id}</td>
                        <td><strong>${h.milestoneTitle}</strong></td>
                        <td><code>${h.fromStatus} ➔ ${h.toStatus}</code></td>
                        <td>${h.changedByUsername}</td>
                        <td><span class="badge-${(h.changedByRole || '').toLowerCase()} user-role-badge">${h.changedByRole}</span></td>
                        <td style="max-width: 250px;">${h.reason || 'Transition recorded'}</td>
                        <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;">${h.createdAt ? h.createdAt.replace('T', ' ') : ''}</td>
                    `;
                    histBody.appendChild(tr);
                });
            }
        } catch (e) {
            console.error('Ledger load error:', e);
        }
    },

    showAuditTrail() {
        this.switchTab('ledger');
    },

    // -------------------------------------------------------------
    // TAB 4: ALERTS & NOTIFICATIONS
    // -------------------------------------------------------------
    async loadNotificationsView() {
        await this.fetchNotifications();
    },

    async fetchNotifications() {
        if (!this.token) return;
        try {
            const res = await fetch(`${API_BASE}/notifications`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) return;

            const notifs = await res.json();
            const unread = notifs.filter(n => !n.read).length;

            const badge = document.getElementById('notif-badge');
            if (unread > 0) {
                badge.innerText = unread;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }

            if (this.activeTab === 'notifications') {
                const container = document.getElementById('notifications-container');
                container.innerHTML = '';

                if (notifs.length === 0) {
                    container.innerHTML = '<div style="color: #94a3b8; padding: 20px;">No notifications yet.</div>';
                } else {
                    notifs.forEach(n => {
                        const div = document.createElement('div');
                        div.className = `notif-card ${n.read ? '' : 'unread'}`;
                        div.innerHTML = `
                            <div class="notif-content">
                                <p>${n.message}</p>
                                <small>Actor: ${n.actorName || 'System'} • ${n.createdAt ? n.createdAt.replace('T', ' ') : ''}</small>
                            </div>
                            ${!n.read ? `<button class="btn btn-secondary btn-sm" onclick="app.markSingleRead(${n.id})">Mark Read</button>` : ''}
                        `;
                        container.appendChild(div);
                    });
                }
            }
        } catch (e) {}
    },

    async markAllNotificationsRead() {
        try {
            await fetch(`${API_BASE}/notifications/mark-read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            this.showToast('All notifications marked as read', 'info');
            this.fetchNotifications();
        } catch (e) {}
    },

    async markSingleRead(id) {
        try {
            await fetch(`${API_BASE}/notifications/${id}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            this.fetchNotifications();
        } catch (e) {}
    },

    startNotificationPoller() {
        setInterval(() => {
            this.fetchNotifications();
        }, 12000);
    },

    // -------------------------------------------------------------
    // TAB 5: ADMIN PLATFORM INTEGRITY
    // -------------------------------------------------------------
    async loadAdminView() {
        try {
            const res = await fetch(`${API_BASE}/admin/overview`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!res.ok) {
                this.showToast('Admin privilege required for this view. Please switch to the Admin demo persona.', 'error');
                return;
            }

            const data = await res.json();
            document.getElementById('admin-total-contracts').innerText = data.totalContracts || 0;
            document.getElementById('admin-total-txs').innerText = (data.allTransactions || []).length;
            document.getElementById('admin-total-users').innerText = (data.users || []).length;

            const tbody = document.getElementById('admin-contracts-table-body');
            tbody.innerHTML = '';

            (data.contracts || []).forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>#C-${c.id}</strong></td>
                    <td>${c.jobTitle}</td>
                    <td>${c.clientName}</td>
                    <td>${c.freelancerName}</td>
                    <td>$${Number(c.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td class="text-emerald">$${Number(c.escrowBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td><span class="status-badge ${c.status === 'ACTIVE' ? 'accepted' : 'paid'}">${c.status}</span></td>
                    <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;">${c.createdAt ? c.createdAt.replace('T', ' ') : ''}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            console.error('Admin overview error:', e);
        }
    },

    // -------------------------------------------------------------
    // UTILITIES & MODAL CONTROLS
    // -------------------------------------------------------------
    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
