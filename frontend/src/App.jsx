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

  // Modal states
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
    'client@escrowflow.com': 'password123',
    'freelancer@escrowflow.com': 'password123',
    'admin@escrowflow.com': 'password123'
  };

  useEffect(() => {
    loginUser('client@escrowflow.com');
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loginUser = async (email) => {
    try {
      const password = demoAccounts[email] || 'password123';
      const user = await api.login(email, password);
      setCurrentUser(user);
      showToast(`Switched persona to ${user.fullName} (${user.role})`, 'info');
      loadDataForCurrentTab(activeTab);
      loadNotifications();
    } catch (e) {
      showToast(e.error || 'Authentication failed', 'error');
    }
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
      showToast('Milestone APPROVED! ACID fund transfer recorded in MySQL ledger.', 'success');
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
            <small>Core Guarantee:</small>
            <p>"State-Verified Fund Release: Funds move only upon verified client milestone approval."</p>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <h1>{activeTab.toUpperCase()}</h1>
            <span className="sub-subtitle">Milestone-based escrow contracting and authority verification</span>
          </div>
          <div className="header-right">
            <div className="role-switcher-box">
              <label>Demo Role Switcher:</label>
              <select onChange={(e) => loginUser(e.target.value)} value={currentUser?.email || ''}>
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
          </div>
        </header>

        {/* TAB CONTENTS */}
        {activeTab === 'milestones' && contractDetails && (
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

        {/* TOAST */}
        {toast && <div className={`toast ${toast.type}`} style={{ position: 'fixed', bottom: 20, right: 20 }}>{toast.message}</div>}
      </main>

      {/* MODALS */}
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
                <textarea className="form-control" value={submitNotes} onChange={(e) => setSubmitNotes(e.target.value)} placeholder="Summary of changes..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSubmitModalMilestoneId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={executeSubmitDeliverable}>Submit for Review</button>
            </div>
          </div>
        </div>
      )}

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
                <textarea className="form-control" value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="State missing requirements..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDisputeModalMilestoneId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={executeDisputeMilestone}>Request Revision</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
