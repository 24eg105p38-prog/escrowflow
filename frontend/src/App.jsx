import React, { useState, useEffect } from 'react';
import { api, setAuthToken } from './services/api';
import './App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('milestones');
  const [contractDetails, setContractDetails] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [adminData, setAdminData] = useState(null);
  const [toast, setToast] = useState(null);

  // Authentication Modal & Form States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('CLIENT');

  // Operation Modals
  const [submitModalMilestoneId, setSubmitModalMilestoneId] = useState(null);
  const [submitEvidence, setSubmitEvidence] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');

  const [disputeModalMilestoneId, setDisputeModalMilestoneId] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  const [auditModalData, setAuditModalData] = useState(null);

  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobBudget, setJobBudget] = useState('');
  const [jobCategory, setJobCategory] = useState('Fullstack Development');
  const [jobDescription, setJobDescription] = useState('');

  const [bidModalJob, setBidModalJob] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidTimeline, setBidTimeline] = useState('');
  const [bidPitch, setBidPitch] = useState('');

  const demoAccounts = {
    'client@escrowflow.com': { pass: 'password123', label: 'Client (Acme Corp)' },
    'freelancer@escrowflow.com': { pass: 'password123', label: 'Freelancer (Alex Dev)' },
    'admin@escrowflow.com': { pass: 'password123', label: 'Admin (Gade Vinay)' }
  };

  useEffect(() => {
    // Attempt auto-login if token exists or default to demo client
    const existingToken = localStorage.getItem('escrowflow_token');
    if (existingToken) {
      api.getCurrentUser()
        .then(user => {
          setCurrentUser(user);
          loadDataForCurrentTab(activeTab);
          loadNotifications();
        })
        .catch(() => {
          quickDemoLogin('client@escrowflow.com');
        });
    } else {
      quickDemoLogin('client@escrowflow.com');
    }
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Quick Demo Login
  const quickDemoLogin = async (email) => {
    try {
      const password = demoAccounts[email]?.pass || 'password123';
      const user = await api.login(email, password);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      showToast(`Logged in as ${user.fullName} (${user.role})`, 'success');
      loadDataForCurrentTab(activeTab);
      loadNotifications();
    } catch (e) {
      showToast(e.error || 'Demo login failed', 'error');
    }
  };

  // Custom Credentials Login
  const handleCustomLogin = async (e) => {
    e?.preventDefault();
    if (!loginEmail || !loginPassword) {
      showToast('Please enter both email and password', 'error');
      return;
    }
    try {
      const user = await api.login(loginEmail, loginPassword);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      setLoginPassword('');
      showToast(`Welcome back, ${user.fullName}!`, 'success');
      loadDataForCurrentTab(activeTab);
      loadNotifications();
    } catch (e) {
      showToast(e.error || 'Invalid email or password', 'error');
    }
  };

  // Register New Account
  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!regEmail || !regPassword || !regUsername || !regFullName) {
      showToast('Please fill in all registration fields', 'error');
      return;
    }
    try {
      const user = await api.register({
        fullName: regFullName,
        username: regUsername,
        email: regEmail,
        password: regPassword,
        role: regRole
      });
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      showToast(`Account registered and logged in as ${user.fullName}!`, 'success');
      loadDataForCurrentTab(activeTab);
      loadNotifications();
    } catch (e) {
      showToast(e.error || 'Registration failed', 'error');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    showToast('You have been logged out successfully.', 'info');
  };

  const loadDataForCurrentTab = async (tab) => {
    if (tab === 'milestones' || tab === 'ledger') {
      try {
        const details = await api.getContractDetails(1);
        setContractDetails(details);
      } catch (e) {}
    } else if (tab === 'jobs') {
      try {
        const jobsList = await api.getJobs();
        const jobsWithBids = await Promise.all(jobsList.map(async (j) => {
          try {
            const bids = await api.getJobBids(j.id);
            return { ...j, bids };
          } catch (e) {
            return { ...j, bids: [] };
          }
        }));
        setJobs(jobsWithBids);
      } catch (e) {}
    } else if (tab === 'admin') {
      try {
        const overview = await api.getAdminOverview();
        setAdminData(overview);
      } catch (e) {}
    }
  };

  const loadNotifications = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (e) {}
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    loadDataForCurrentTab(tab);
  };

  // Submit Deliverable
  const executeSubmitDeliverable = async () => {
    if (!submitEvidence.trim()) {
      showToast('Please provide deliverable evidence link or text', 'error');
      return;
    }
    try {
      await api.submitMilestoneDeliverable(submitModalMilestoneId, submitEvidence, submitNotes);
      showToast('Deliverable submitted successfully! Client notified.', 'success');
      setSubmitModalMilestoneId(null);
      setSubmitEvidence('');
      setSubmitNotes('');
      loadDataForCurrentTab('milestones');
      loadNotifications();
    } catch (e) {
      showToast(e.error || 'Submission failed', 'error');
    }
  };

  // Approve Milestone (Client Authority)
  const executeApproveMilestone = async (milestoneId) => {
    if (!window.confirm('Execute state-verified fund release? Funds will move from Escrow to Freelancer in an ACID transaction.')) return;
    try {
      await api.approveMilestone(milestoneId);
      showToast('Milestone APPROVED! ACID fund transfer recorded in ledger.', 'success');
      loadDataForCurrentTab('milestones');
      const updatedUser = await api.getCurrentUser();
      setCurrentUser(updatedUser);
      loadNotifications();
    } catch (e) {
      showToast(e.error || 'Approval failed', 'error');
    }
  };

  // Dispute / Revision
  const executeDisputeMilestone = async () => {
    if (!disputeReason.trim()) {
      showToast('Mandatory stated reason is required to dispute or request revision', 'error');
      return;
    }
    try {
      await api.disputeMilestone(disputeModalMilestoneId, disputeReason);
      showToast('Revision requested. Milestone returned to PENDING with recorded reason.', 'info');
      setDisputeModalMilestoneId(null);
      setDisputeReason('');
      loadDataForCurrentTab('milestones');
      loadNotifications();
    } catch (e) {
      showToast(e.error || 'Revision request failed', 'error');
    }
  };

  // Accept Bid
  const executeAcceptBid = async (jobId, bidId) => {
    if (!window.confirm('Accept proposal? Funds will be locked into Escrow and a milestone contract will be formed.')) return;
    try {
      await api.acceptBid(jobId, bidId);
      showToast('Bid accepted! Escrow funds locked and contract created.', 'success');
      handleTabChange('milestones');
      const updatedUser = await api.getCurrentUser();
      setCurrentUser(updatedUser);
    } catch (e) {
      showToast(e.error || 'Bid acceptance failed', 'error');
    }
  };

  // Post Job
  const executePostJob = async () => {
    if (!jobTitle || !jobBudget) {
      showToast('Please provide a job title and budget', 'error');
      return;
    }
    try {
      await api.createJob({
        title: jobTitle,
        category: jobCategory,
        budget: parseFloat(jobBudget),
        description: jobDescription,
        milestones: [
          { title: 'Project Initiation & Setup', description: 'Core requirements alignment', amount: parseFloat(jobBudget) * 0.4, dueDateDays: 5 },
          { title: 'Final Delivery & Acceptance', description: 'Completion and deployment', amount: parseFloat(jobBudget) * 0.6, dueDateDays: 10 }
        ]
      });
      showToast('Job posted successfully with structured milestones!', 'success');
      setIsPostJobModalOpen(false);
      setJobTitle('');
      setJobBudget('');
      setJobDescription('');
      loadDataForCurrentTab('jobs');
    } catch (e) {
      showToast(e.error || 'Failed to post job', 'error');
    }
  };

  // Submit Bid
  const executeSubmitBid = async () => {
    if (!bidAmount || !bidTimeline) {
      showToast('Please enter bid amount and timeline', 'error');
      return;
    }
    try {
      await api.submitBid(bidModalJob.id, {
        bidAmount: parseFloat(bidAmount),
        proposedTimelineDays: parseInt(bidTimeline),
        coverLetter: bidPitch
      });
      showToast('Proposal submitted successfully!', 'success');
      setBidModalJob(null);
      setBidAmount('');
      setBidTimeline('');
      setBidPitch('');
      loadDataForCurrentTab('jobs');
    } catch (e) {
      showToast(e.error || 'Failed to submit proposal', 'error');
    }
  };

  const markAllRead = async () => {
    try {
      await api.markNotificationsRead();
      loadNotifications();
      showToast('All notifications marked as read', 'info');
    } catch (e) {}
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div className="brand-text">
            <h2>EscrowFlow</h2>
            <span>Contract & Escrow Portal</span>
          </div>
        </div>

        <div className="student-attribution">
          <span className="attr-label">Project Author</span>
          <p className="attr-name">Gade Vinay</p>
          <p className="attr-info">Roll: 24EG105P38 • CSE-P</p>
          <p className="attr-univ">Anurag University</p>
        </div>

        <nav className="nav-menu">
          <button className={`nav-item ${activeTab === 'milestones' ? 'active' : ''}`} onClick={() => handleTabChange('milestones')}>
            <span>Contracts & Milestones</span>
          </button>
          <button className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => handleTabChange('jobs')}>
            <span>Job Board & Bids</span>
          </button>
          <button className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => handleTabChange('ledger')}>
            <span>Escrow Ledger & Audit</span>
          </button>
          <button className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => handleTabChange('notifications')}>
            <span>Alerts & Notifications</span>
            {unreadNotifsCount > 0 && <span className="badge-count">{unreadNotifsCount}</span>}
          </button>
          <button className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => handleTabChange('admin')}>
            <span>Platform Integrity (Admin)</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="core-principle">
            <small>Core Architecture Guarantee:</small>
            <p>"State-Verified Fund Release: Funds move only upon verified client milestone approval."</p>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="main-content">
        {/* TOP HEADER */}
        <header className="top-header">
          <div className="header-left">
            <h1>{activeTab.toUpperCase()}</h1>
            <span className="sub-subtitle">Milestone-based escrow contracting and authority verification</span>
          </div>

          <div className="header-right">
            {currentUser ? (
              <>
                <div className="role-switcher-box">
                  <label>Demo Role Switcher:</label>
                  <select onChange={(e) => quickDemoLogin(e.target.value)} value={currentUser?.email || ''}>
                    <option value="client@escrowflow.com">Client: Acme Corp ($5,000 Wallet)</option>
                    <option value="freelancer@escrowflow.com">Freelancer: Alex Dev ($1,300 Earned)</option>
                    <option value="admin@escrowflow.com">Admin: Gade Vinay (Platform Auditor)</option>
                  </select>
                </div>

                <div className="user-pill">
                  <div className="user-avatar">{(currentUser?.username || 'U')[0].toUpperCase()}</div>
                  <div className="user-info">
                    <span className="user-name">{currentUser?.fullName}</span>
                    <span className={`user-role-badge badge-${currentUser?.role?.toLowerCase()}`}>{currentUser?.role}</span>
                  </div>
                </div>

                <div className="balance-card">
                  <span className="balance-label">Mock Balance</span>
                  <span className="balance-value">${Number(currentUser?.mockBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* LOGOUT BUTTON */}
                <button className="btn btn-logout" onClick={handleLogout} title="Log Out of Current Session">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <div className="logged-out-header-actions">
                <button className="btn btn-secondary" onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}>
                  Log In
                </button>
                <button className="btn btn-primary" onClick={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}>
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </header>

        {/* LOGGED OUT HERO BANNER */}
        {!currentUser && (
          <div className="logged-out-hero">
            <div className="hero-content">
              <span className="hero-tag">SECURE ESCROW PLATFORM</span>
              <h2>Welcome to EscrowFlow</h2>
              <p>Experience milestone-based escrow contracting with ACID transactional guarantees, cryptographic audit logging, and dual-party dispute resolution.</p>
              
              <div className="demo-quick-login-grid">
                <div className="quick-login-card" onClick={() => quickDemoLogin('client@escrowflow.com')}>
                  <div className="card-badge">CLIENT PERSONA</div>
                  <h4>Acme Corp</h4>
                  <p>Fund contracts, lock escrow deposits, and release payments upon milestone completion.</p>
                  <button className="btn btn-primary btn-sm">Log In as Client →</button>
                </div>

                <div className="quick-login-card" onClick={() => quickDemoLogin('freelancer@escrowflow.com')}>
                  <div className="card-badge">FREELANCER PERSONA</div>
                  <h4>Alex Dev</h4>
                  <p>Submit milestone deliverables, request client reviews, and withdraw verified earnings.</p>
                  <button className="btn btn-success btn-sm">Log In as Freelancer →</button>
                </div>

                <div className="quick-login-card" onClick={() => quickDemoLogin('admin@escrowflow.com')}>
                  <div className="card-badge">ADMIN PERSONA</div>
                  <h4>Gade Vinay</h4>
                  <p>Review audit logs, monitor platform-wide escrow balances, and resolve escalated disputes.</p>
                  <button className="btn btn-secondary btn-sm">Log In as Admin →</button>
                </div>
              </div>

              <div className="hero-custom-auth-link">
                <span>Have your own credentials? </span>
                <button className="btn-link" onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}>Click here to Log In</button>
                <span> or </span>
                <button className="btn-link" onClick={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}>Create a New Account</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: MILESTONES */}
        {currentUser && activeTab === 'milestones' && contractDetails && (
          <div className="tab-content active">
            <div className="contract-banner">
              <div className="contract-info">
                <span className="contract-tag">CONTRACT #{contractDetails.contract.id} • {contractDetails.contract.status}</span>
                <h2>{contractDetails.contract.jobTitle}</h2>
                <div className="contract-meta-row">
                  <span>Client: <strong>{contractDetails.contract.clientName}</strong></span>
                  <span>Freelancer: <strong>{contractDetails.contract.freelancerName}</strong></span>
                  <span>Total: <strong>${Number(contractDetails.contract.totalAmount).toLocaleString()}</strong></span>
                  <span>Escrow: <strong className="text-emerald">${Number(contractDetails.contract.escrowBalance).toLocaleString()}</strong></span>
                </div>
              </div>
              <div className="contract-actions">
                <button className="btn btn-secondary" onClick={() => handleTabChange('ledger')}>View Full Contract Ledger</button>
              </div>
            </div>

            <div className="section-heading-row">
              <div>
                <h3>Milestone Breakdown (Table 6)</h3>
                <p className="section-desc">Each milestone carries scope, amount, status, and authority-verified controls.</p>
              </div>
            </div>

            <div className="milestones-grid">
              {(contractDetails.milestones || []).map((m, idx) => {
                const isClient = currentUser?.id === contractDetails.contract.clientId;
                const isFreelancer = currentUser?.id === contractDetails.contract.freelancerId;

                return (
                  <div key={m.id} className="milestone-card">
                    <div>
                      <div className="milestone-header">
                        <div>
                          <span className="milestone-order">Milestone #{m.orderIndex || (idx + 1)}</span>
                          <h4>{m.title}</h4>
                        </div>
                        <span className={`status-badge ${m.status.toLowerCase()}`}>{m.status}</span>
                      </div>
                      <p className="milestone-desc">{m.description}</p>
                      <div className="milestone-financial-bar">
                        <div>Amount: <strong>${Number(m.amount).toLocaleString()}</strong></div>
                        <div>Timeline: <strong>{m.dueDateDays} Days</strong></div>
                      </div>
                      {m.deliverableEvidence && (
                        <div className="milestone-evidence-box">
                          <span className="evidence-label">Deliverable Evidence:</span>
                          <div className="evidence-text">{m.deliverableEvidence}</div>
                        </div>
                      )}
                      {m.disputeReason && (
                        <div className="dispute-box">
                          <span className="dispute-label">Revision Request:</span>
                          <div className="dispute-text">{m.disputeReason}</div>
                        </div>
                      )}
                    </div>
                    <div className="milestone-card-footer">
                      <button className="btn btn-secondary btn-sm" onClick={() => setAuditModalData(m)}>Audit</button>
                      <div className="btn-group">
                        {m.status === 'PENDING' && isFreelancer && (
                          <button className="btn btn-primary btn-sm" onClick={() => setSubmitModalMilestoneId(m.id)}>Submit Deliverable</button>
                        )}
                        {m.status === 'SUBMITTED' && isClient && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => executeApproveMilestone(m.id)}>Approve (${m.amount})</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDisputeModalMilestoneId(m.id)}>Request Revision</button>
                          </>
                        )}
                        {m.status === 'PAID' && <span className="text-emerald">✓ Paid</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: JOB BOARD & BIDS */}
        {currentUser && activeTab === 'jobs' && (
          <div className="tab-content active">
            <div className="section-heading-row">
              <div>
                <h3>Freelance Job Marketplace</h3>
                <p className="section-desc">Post projects with structured milestone breakdowns, submit competitive proposals, or accept bids.</p>
              </div>
              {currentUser?.role === 'CLIENT' && (
                <button className="btn btn-primary" onClick={() => setIsPostJobModalOpen(true)}>
                  + Post New Job
                </button>
              )}
            </div>

            <div className="jobs-grid">
              {jobs.map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-card-header">
                    <div>
                      <span className="badge-neutral">{job.category}</span>
                      <h4>{job.title}</h4>
                      <small className="text-muted">Posted by {job.clientName} • Status: <strong>{job.status}</strong></small>
                    </div>
                    <div className="job-budget-tag">${Number(job.budget).toLocaleString()}</div>
                  </div>
                  <p className="job-desc">{job.description}</p>
                  
                  <div className="job-bids-section">
                    <h5>Proposals / Bids ({job.bids?.length || 0})</h5>
                    {job.bids && job.bids.length > 0 ? (
                      <div className="bids-list">
                        {job.bids.map(b => (
                          <div key={b.id} className="bid-item">
                            <div>
                              <strong>{b.freelancerName}</strong> bid <strong>${Number(b.bidAmount).toLocaleString()}</strong> ({b.proposedTimelineDays} days)
                              <p className="bid-pitch">"{b.coverLetter}"</p>
                            </div>
                            {currentUser?.role === 'CLIENT' && job.status === 'OPEN' && (
                              <button className="btn btn-success btn-sm" onClick={() => executeAcceptBid(job.id, b.id)}>Accept & Fund</button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted"><small>No proposals submitted yet.</small></p>
                    )}
                  </div>

                  <div className="job-card-footer">
                    {currentUser?.role === 'FREELANCER' && job.status === 'OPEN' && (
                      <button className="btn btn-primary btn-sm" onClick={() => setBidModalJob(job)}>Submit Proposal</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LEDGER */}
        {currentUser && activeTab === 'ledger' && contractDetails && (
          <div className="tab-content active">
            <div className="ledger-header-box">
              <div className="ledger-header-text">
                <h3>ACID-Compliant Escrow Ledger & Reconstructable Audit Trail</h3>
                <p>Every fund movement is persisted as an immutable row in the transaction ledger. Balances cannot be directly edited.</p>
              </div>
              <div className="ledger-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>State & Hash Verified</span>
              </div>
            </div>

            <div className="table-card" style={{ marginBottom: 24 }}>
              <div className="table-card-header">
                <h4>Financial Transaction Ledger (MySQL)</h4>
                <span className="badge-neutral">Immutable Records</span>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tx ID</th>
                      <th>Type</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Amount</th>
                      <th>Description</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(contractDetails.transactions || []).map(tx => (
                      <tr key={tx.id}>
                        <td><code>#{tx.id}</code></td>
                        <td><span className={`status-badge ${tx.type === 'DEPOSIT' ? 'pending' : 'paid'}`}>{tx.type}</span></td>
                        <td>{tx.fromUserName}</td>
                        <td>{tx.toUserName}</td>
                        <td><strong>${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                        <td>{tx.description}</td>
                        <td><small>{new Date(tx.timestamp).toLocaleString()}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="table-card">
              <div className="table-card-header">
                <h4>Milestone Status Lifecycle History</h4>
                <span className="badge-neutral">Audit Trail</span>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Event #</th>
                      <th>Milestone</th>
                      <th>Status Transition</th>
                      <th>Acting User</th>
                      <th>Role</th>
                      <th>Stated Reason / Evidence</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(contractDetails.statusHistory || []).map(h => (
                      <tr key={h.id}>
                        <td><code>#{h.id}</code></td>
                        <td>{h.milestoneTitle}</td>
                        <td><span className="status-badge paid">{h.fromStatus} → {h.toStatus}</span></td>
                        <td>{h.actorName}</td>
                        <td><span className={`user-role-badge badge-${h.actorRole?.toLowerCase()}`}>{h.actorRole}</span></td>
                        <td>{h.reason || 'Standard lifecycle event'}</td>
                        <td><small>{new Date(h.timestamp).toLocaleString()}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS */}
        {currentUser && activeTab === 'notifications' && (
          <div className="tab-content active">
            <div className="section-heading-row">
              <div>
                <h3>Event-Driven Notification Stream</h3>
                <p className="section-desc">Automated alerts for milestone submissions, client approvals, and dispute updates.</p>
              </div>
              <button className="btn btn-secondary" onClick={markAllRead}>Mark All Read</button>
            </div>

            <div className="notifications-list">
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`}>
                    <div className="notif-indicator"></div>
                    <div className="notif-body">
                      <p className="notif-message">{n.message}</p>
                      <small className="notif-time">{new Date(n.createdAt).toLocaleString()}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No notifications in your stream.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ADMIN */}
        {currentUser && activeTab === 'admin' && (
          <div className="tab-content active">
            <div className="admin-notice">
              <div className="admin-notice-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div className="admin-notice-content">
                <h4>Platform Administrator Oversight Portal</h4>
                <p>Monitors contract integrity, audits mock ledger balance consistency, and reviews escalated dispute cases across the platform.</p>
              </div>
            </div>

            <div className="admin-kpi-grid">
              <div className="admin-stat-card">
                <span>Total Active Contracts</span>
                <h2>{adminData?.totalContracts || 1}</h2>
              </div>
              <div className="admin-stat-card">
                <span>Total Ledger Transactions</span>
                <h2>{adminData?.totalTransactions || 3}</h2>
              </div>
              <div className="admin-stat-card">
                <span>Total Volume in Escrow</span>
                <h2>${Number(adminData?.totalEscrowVolume || 1200).toLocaleString()}</h2>
              </div>
              <div className="admin-stat-card">
                <span>Disputed Milestones</span>
                <h2>{adminData?.disputedMilestonesCount || 0}</h2>
              </div>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toast && <div className={`toast ${toast.type}`} style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>{toast.message}</div>}
      </main>

      {/* AUTH MODAL (LOGIN & REGISTER) */}
      {isAuthModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog auth-modal-dialog">
            <div className="modal-header">
              <h3>{authMode === 'login' ? 'Log In to EscrowFlow' : 'Create an Account'}</h3>
              <button className="modal-close" onClick={() => setIsAuthModalOpen(false)}>&times;</button>
            </div>

            <div className="auth-tab-selector">
              <button className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>Log In</button>
              <button className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`} onClick={() => setAuthMode('register')}>Register</button>
            </div>

            <div className="modal-body">
              {authMode === 'login' ? (
                <form onSubmit={handleCustomLogin}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input className="form-control" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="name@example.com" autoFocus />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input className="form-control" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Log In</button>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input className="form-control" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input className="form-control" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} placeholder="johndoe" />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input className="form-control" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="john@example.com" />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input className="form-control" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select className="form-control" value={regRole} onChange={(e) => setRegRole(e.target.value)}>
                      <option value="CLIENT">Client (Hire & Escrow Funds)</option>
                      <option value="FREELANCER">Freelancer (Work & Earn)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Create Account</button>
                </form>
              )}

              <div className="modal-divider">
                <span>OR FAST DEMO LOGIN</span>
              </div>

              <div className="demo-accounts-pill-list">
                <button type="button" className="demo-pill-btn" onClick={() => quickDemoLogin('client@escrowflow.com')}>
                  👔 Acme Corp (Client)
                </button>
                <button type="button" className="demo-pill-btn" onClick={() => quickDemoLogin('freelancer@escrowflow.com')}>
                  💻 Alex Dev (Freelancer)
                </button>
                <button type="button" className="demo-pill-btn" onClick={() => quickDemoLogin('admin@escrowflow.com')}>
                  🛡️ Gade Vinay (Admin)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT EVIDENCE MODAL */}
      {submitModalMilestoneId && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Submit Deliverable Evidence</h3>
              <button className="modal-close" onClick={() => setSubmitModalMilestoneId(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Deliverable Evidence / Repository Link *</label>
                <input className="form-control" value={submitEvidence} onChange={(e) => setSubmitEvidence(e.target.value)} placeholder="https://github.com/... or PR link" />
              </div>
              <div className="form-group">
                <label>Review Notes *</label>
                <textarea className="form-control" value={submitNotes} onChange={(e) => setSubmitNotes(e.target.value)} placeholder="Summary of deliverables..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSubmitModalMilestoneId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={executeSubmitDeliverable}>Submit for Review</button>
            </div>
          </div>
        </div>
      )}

      {/* DISPUTE MODAL */}
      {disputeModalMilestoneId && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Request Revision / State Dispute</h3>
              <button className="modal-close" onClick={() => setDisputeModalMilestoneId(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Mandatory Stated Reason *</label>
                <textarea className="form-control" value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="State missing requirements or defects..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDisputeModalMilestoneId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={executeDisputeMilestone}>Request Revision</button>
            </div>
          </div>
        </div>
      )}

      {/* POST JOB MODAL */}
      {isPostJobModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Post New Freelance Job</h3>
              <button className="modal-close" onClick={() => setIsPostJobModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Job Title *</label>
                <input className="form-control" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Next.js SaaS Web Application" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-control" value={jobCategory} onChange={(e) => setJobCategory(e.target.value)}>
                  <option value="Fullstack Development">Fullstack Development</option>
                  <option value="Cloud Architecture">Cloud Architecture</option>
                  <option value="Smart Contracts">Smart Contracts & Security</option>
                </select>
              </div>
              <div className="form-group">
                <label>Total Budget ($) *</label>
                <input className="form-control" type="number" value={jobBudget} onChange={(e) => setJobBudget(e.target.value)} placeholder="1500" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Detailed project scope..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsPostJobModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={executePostJob}>Post Job</button>
            </div>
          </div>
        </div>
      )}

      {/* PLACE BID MODAL */}
      {bidModalJob && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Submit Proposal for "{bidModalJob.title}"</h3>
              <button className="modal-close" onClick={() => setBidModalJob(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Proposed Amount ($) *</label>
                <input className="form-control" type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder={bidModalJob.budget} />
              </div>
              <div className="form-group">
                <label>Delivery Timeline (Days) *</label>
                <input className="form-control" type="number" value={bidTimeline} onChange={(e) => setBidTimeline(e.target.value)} placeholder="14" />
              </div>
              <div className="form-group">
                <label>Proposal Cover Pitch *</label>
                <textarea className="form-control" value={bidPitch} onChange={(e) => setBidPitch(e.target.value)} placeholder="Explain relevant expertise and milestone approach..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setBidModalJob(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={executeSubmitBid}>Submit Proposal</button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT MODAL */}
      {auditModalData && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Milestone #{auditModalData.id} Status Audit</h3>
              <button className="modal-close" onClick={() => setAuditModalData(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <h4>{auditModalData.title}</h4>
              <p className="text-muted">{auditModalData.description}</p>
              <div style={{ marginTop: 12 }}>
                <p>Status: <span className={`status-badge ${auditModalData.status?.toLowerCase()}`}>{auditModalData.status}</span></p>
                <p>Amount: <strong>${Number(auditModalData.amount).toLocaleString()}</strong></p>
                {auditModalData.deliverableEvidence && (
                  <p>Evidence: <code>{auditModalData.deliverableEvidence}</code></p>
                )}
                {auditModalData.disputeReason && (
                  <p>Revision Note: <span className="text-danger">{auditModalData.disputeReason}</span></p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAuditModalData(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
