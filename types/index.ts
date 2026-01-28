import { type Role } from "@/lib/roles";

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    agent?: {
        id: string;
        codename: string;
        status: string;
    } | null;
}

export interface Agent {
    id: string;
    codename: string;
    email: string;
    faculty: string;
    level: string;
    status: string;
    missions: number;
    createdAt: string;
}

export interface OperationPlan {
    id: string;
    operationId: string;
    title: string;
    content?: string;
    status: string;
    attachments?: string[];
    createdAt: string;
}

export interface Operation {
    id: string;
    name: string;
    description?: string;
    status: string;
    priority?: string;
    progress: number;
    deadline: string;
    teamSize: number;
    attachments?: string[];
    plans?: OperationPlan[];
    createdAt?: string;
}

export interface Intel {
    id: string;
    title: string;
    content: string | null;
    priority: string;
    attachments?: string[];
    createdAt: string;
    source?: { codename: string };
}

export interface Stats {
    agents: { total: number; online: number; away: number; offline: number };
    operations: { total: number; active: number; planning: number; completed: number };
    intel: { total: number; high: number; medium: number; low: number };
    news: { total: number; published: number };
}

export interface BannedIP {
    id: string;
    ip: string;
    reason: string;
    expiresAt: string | null;
    createdAt: string;
}

export interface LoginActivityItem {
    id: string;
    email: string;
    ip: string;
    device: string;
    browser: string;
    os: string;
    status: string;
    reason: string | null;
    createdAt: string;
    user?: { name: string };
}

export interface LoginActivityStats {
    totalToday: number;
    successToday: number;
    failedToday: number;
    uniqueIPs: number;
}

export interface News {
    id: string;
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    category: string;
    published: boolean;
    author?: { codename: string };
    createdAt: string;
    updatedAt: string;
}

export interface VisitorLog {
    id: string;
    ip: string;
    ipFull?: string;
    device: string;
    browser: string;
    os: string;
    country?: string;
    city?: string;
    region?: string;
    isp?: string;
    timezone?: string;
    fingerprint?: string;
    page: string;
    referer?: string;
    userId?: string;
    createdAt: string;
}

export interface VisitorStats {
    total: number;
    uniqueVisitors: number;
    devices: Record<string, number>;
    topBrowsers: { browser: string; count: number }[];
}

export interface Stats {
    total: number;
    uniqueVisitors: number;
    devices: Record<string, number>;
    topBrowsers: { browser: string; count: number }[];
    topCountries: { country: string; count: number }[];
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface Application {
    id: string;
    name: string;
    email: string;
    faculty: string;
    reason: string;
    status: string;
    createdAt: string;
}

export interface Database {
    agents: Agent[];
    operations: Operation[];
    intel: Intel[];
    news: News[];
    applications: Application[];
}