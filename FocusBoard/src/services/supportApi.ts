// Support / Customer Care API Service
// Covers: IssueTypes, SupportTickets, TicketResolutions, UserFeedback, Leads
import { API_BASE_URL } from './apiBase';

const API_BASE = API_BASE_URL;

async function handleResponse<T>(res: Response): Promise<T> {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as any).message || `HTTP ${res.status}`);
    return (json as any).data as T;
}

async function fetchList<T>(path: string, page = 1, limit = 100, extra = ''): Promise<{ data: T[]; total: number }> {
    const res = await fetch(`${API_BASE}${path}?page=${page}&limit=${limit}${extra ? '&' + extra : ''}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as any).message || `Failed to fetch ${path}`);
    return { data: json.data || [], total: json.total || 0 };
}

// ── Issue Types ───────────────────────────────────────────────────────────────

export interface IssueType {
    _id: string;
    name: string;
    defaultPriority?: 'Low' | 'Medium' | 'High' | 'Critical';
    slaResolutionDays?: number;
    supportEmail?: string;
    isActive?: boolean;
    autoReplyTemplate?: string;
    createdAt?: string;
}

export interface IssueTypePayload {
    name: string;
    defaultPriority?: 'Low' | 'Medium' | 'High' | 'Critical';
    slaResolutionDays?: number;
    supportEmail?: string;
    isActive?: boolean;
    autoReplyTemplate?: string;
}

export const createIssueType = (p: IssueTypePayload) =>
    fetch(`${API_BASE}/issue-types`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).then(r => handleResponse<IssueType>(r));

export const getAllIssueTypes = (page = 1, limit = 100) => fetchList<IssueType>('/issue-types', page, limit);
export const getIssueTypeById = (id: string) => fetch(`${API_BASE}/issue-types/${id}`).then(r => handleResponse<IssueType>(r));
export const updateIssueType = (id: string, p: Partial<IssueTypePayload>) =>
    fetch(`${API_BASE}/issue-types/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).then(r => handleResponse<IssueType>(r));
export const deleteIssueType = async (id: string) => {
    const res = await fetch(`${API_BASE}/issue-types/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Delete failed');
};

// ── Support Tickets ───────────────────────────────────────────────────────────

export interface SupportTicket {
    _id: string;
    userId: string | { _id: string; name: string; email_id: string };
    issueTypeId: string | { _id: string; name: string; defaultPriority: string };
    subject: string;
    description: string;
    screenshotUrl?: string;
    deviceInfo?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    consentToShareLogs?: boolean;
    createdAt?: string;
}

export interface TicketPayload {
    userId: string;
    issueTypeId: string;
    subject: string;
    description: string;
    screenshotUrl?: string;
    deviceInfo?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    consentToShareLogs?: boolean;
}

export const createTicket = (p: TicketPayload) =>
    fetch(`${API_BASE}/support-tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).then(r => handleResponse<SupportTicket>(r));
export const getAllTickets = (page = 1, limit = 100, extra = '') => fetchList<SupportTicket>('/support-tickets', page, limit, extra);
export const getTicketById = (id: string) => fetch(`${API_BASE}/support-tickets/${id}`).then(r => handleResponse<SupportTicket>(r));
export const updateTicket = (id: string, p: Partial<TicketPayload>) =>
    fetch(`${API_BASE}/support-tickets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).then(r => handleResponse<SupportTicket>(r));
export const deleteTicket = async (id: string) => {
    const res = await fetch(`${API_BASE}/support-tickets/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Delete failed');
};

// ── Ticket Resolutions ────────────────────────────────────────────────────────

export interface TicketResolution {
    _id: string;
    ticketId: string | { _id: string; subject: string; status: string; priority: string };
    agentName: string;
    resolutionNotes?: string;
    escalateToDevTeam?: boolean;
    statusUpdate?: 'Resolved' | 'Waiting on User' | 'Open';
    resolvedAt?: string;
    createdAt?: string;
}

export interface ResolutionPayload {
    ticketId: string;
    agentName: string;
    resolutionNotes?: string;
    escalateToDevTeam?: boolean;
    statusUpdate?: 'Resolved' | 'Waiting on User' | 'Open';
    resolvedAt?: string;
}

export const createResolution = (p: ResolutionPayload) =>
    fetch(`${API_BASE}/ticket-resolutions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).then(r => handleResponse<TicketResolution>(r));
export const getAllResolutions = (page = 1, limit = 100, extra = '') => fetchList<TicketResolution>('/ticket-resolutions', page, limit, extra);
export const getResolutionById = (id: string) => fetch(`${API_BASE}/ticket-resolutions/${id}`).then(r => handleResponse<TicketResolution>(r));
export const updateResolution = (id: string, p: Partial<ResolutionPayload>) =>
    fetch(`${API_BASE}/ticket-resolutions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).then(r => handleResponse<TicketResolution>(r));
export const deleteResolution = async (id: string) => {
    const res = await fetch(`${API_BASE}/ticket-resolutions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Delete failed');
};

// ── User Feedback ─────────────────────────────────────────────────────────────

export interface UserFeedback {
    _id: string;
    ticketId: string | { _id: string; subject: string; status: string };
    satisfactionRating: number;
    issueFixed?: 'Yes' | 'No' | 'Partially';
    agentHelpfulness?: number;
    comments?: string;
    canUseAsTestimonial?: boolean;
    createdAt?: string;
}

export interface FeedbackPayload {
    ticketId: string;
    satisfactionRating: number;
    issueFixed?: 'Yes' | 'No' | 'Partially';
    agentHelpfulness?: number;
    comments?: string;
    canUseAsTestimonial?: boolean;
}

export const createFeedback = (p: FeedbackPayload) =>
    fetch(`${API_BASE}/user-feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).then(r => handleResponse<UserFeedback>(r));
export const getAllFeedback = (page = 1, limit = 100, extra = '') => fetchList<UserFeedback>('/user-feedback', page, limit, extra);
export const getFeedbackById = (id: string) => fetch(`${API_BASE}/user-feedback/${id}`).then(r => handleResponse<UserFeedback>(r));
export const updateFeedback = (id: string, p: Partial<FeedbackPayload>) =>
    fetch(`${API_BASE}/user-feedback/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).then(r => handleResponse<UserFeedback>(r));
export const deleteFeedback = async (id: string) => {
    const res = await fetch(`${API_BASE}/user-feedback/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Delete failed');
};

// ── Leads ─────────────────────────────────────────────────────────────────────

export interface Lead {
    _id: string;
    name: string;
    email: string;
    message?: string;
    source?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface LeadPayload {
    name: string;
    email: string;
    message?: string;
    source?: string;
}

export const createLead = (p: LeadPayload) =>
    fetch(`${API_BASE}/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).then(r => handleResponse<Lead>(r));
export const getAllLeads = (page = 1, limit = 100) => fetchList<Lead>('/leads', page, limit);
export const getLeadById = (id: string) => fetch(`${API_BASE}/leads/${id}`).then(r => handleResponse<Lead>(r));
export const updateLead = (id: string, p: Partial<LeadPayload>) =>
    fetch(`${API_BASE}/leads/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).then(r => handleResponse<Lead>(r));
export const deleteLead = async (id: string) => {
    const res = await fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Delete failed');
};
