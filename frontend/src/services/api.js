// EscrowFlow Frontend API Service
const rawApiUrl = import.meta.env.VITE_API_URL || '';
const API_BASE = rawApiUrl ? (rawApiUrl.replace(/\/$/, '') + '/api') : '/api';

let authToken = localStorage.getItem('escrowflow_token') || null;

export const setAuthToken = (token) => {
    authToken = token;
    if (token) {
        localStorage.setItem('escrowflow_token', token);
    } else {
        localStorage.removeItem('escrowflow_token');
    }
};

export const getAuthToken = () => authToken;

const authHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
};

export const api = {
    // Auth endpoints
    login: async (email, password) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw await res.json();
        const data = await res.json();
        setAuthToken(data.token);
        return data;
    },

    getCurrentUser: async () => {
        const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    // Job & Bidding endpoints (Table 8)
    getJobs: async () => {
        const res = await fetch(`${API_BASE}/jobs`);
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    createJob: async (jobData) => {
        const res = await fetch(`${API_BASE}/jobs`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(jobData)
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    getJobBids: async (jobId) => {
        const res = await fetch(`${API_BASE}/jobs/${jobId}/bids`, { headers: authHeaders() });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    submitBid: async (jobId, bidData) => {
        const res = await fetch(`${API_BASE}/jobs/${jobId}/bids`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(bidData)
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    acceptBid: async (jobId, bidId) => {
        const res = await fetch(`${API_BASE}/jobs/${jobId}/bids/${bidId}/accept`, {
            method: 'POST',
            headers: authHeaders()
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    // Contract & Milestone endpoints (Table 8)
    getContracts: async () => {
        const res = await fetch(`${API_BASE}/contracts`, { headers: authHeaders() });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    getContractDetails: async (contractId) => {
        const res = await fetch(`${API_BASE}/contracts/${contractId}`, { headers: authHeaders() });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    getContractLedger: async (contractId) => {
        const res = await fetch(`${API_BASE}/contracts/${contractId}/ledger`, { headers: authHeaders() });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    submitMilestoneDeliverable: async (milestoneId, evidence, note) => {
        const res = await fetch(`${API_BASE}/milestones/${milestoneId}/submit`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ evidence, note })
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    approveMilestone: async (milestoneId) => {
        const res = await fetch(`${API_BASE}/milestones/${milestoneId}/approve`, {
            method: 'POST',
            headers: authHeaders()
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    disputeMilestone: async (milestoneId, reason) => {
        const res = await fetch(`${API_BASE}/milestones/${milestoneId}/dispute`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ reason })
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    getMilestoneHistory: async (milestoneId) => {
        const res = await fetch(`${API_BASE}/milestones/${milestoneId}/history`, { headers: authHeaders() });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    // Notifications
    getNotifications: async () => {
        const res = await fetch(`${API_BASE}/notifications`, { headers: authHeaders() });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    markNotificationsRead: async () => {
        const res = await fetch(`${API_BASE}/notifications/mark-read`, {
            method: 'POST',
            headers: authHeaders()
        });
        return await res.json();
    },

    // Admin
    getAdminOverview: async () => {
        const res = await fetch(`${API_BASE}/admin/overview`, { headers: authHeaders() });
        if (!res.ok) throw await res.json();
        return await res.json();
    }
};
