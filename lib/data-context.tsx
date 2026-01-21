"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types
interface Agent {
    id: string;
    codename: string;
    email: string;
    faculty: string;
    level: string;
    status: string;
    missions: number;
    createdAt: string;
}

interface Operation {
    id: string;
    name: string;
    status: string;
    progress: number;
    deadline: string;
    teamSize: number;
}

interface Intel {
    id: string;
    title: string;
    content: string | null;
    priority: string;
    createdAt: string;
    source?: { codename: string };
}

interface Message {
    id: string;
    content: string;
    read: boolean;
    createdAt: string;
    fromAgent?: { codename: string };
    toAgent?: { codename: string };
}

interface Stats {
    agents: { total: number; online: number; away: number; offline: number };
    operations: { total: number; active: number; planning: number; completed: number };
    intel: { total: number; high: number; medium: number; low: number };
    messages: { total: number; unread: number };
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

interface DataContextType {
    // Data
    agents: Agent[];
    operations: Operation[];
    intel: Intel[];
    messages: Message[];
    stats: Stats | null;
    unreadCount: number;

    // Loading states
    loading: {
        agents: boolean;
        operations: boolean;
        intel: boolean;
        messages: boolean;
        stats: boolean;
    };

    // Fetch functions (with cache)
    fetchAgents: (force?: boolean) => Promise<void>;
    fetchOperations: (force?: boolean) => Promise<void>;
    fetchIntel: (force?: boolean) => Promise<void>;
    fetchMessages: (force?: boolean) => Promise<void>;
    fetchStats: (force?: boolean) => Promise<void>;
    fetchAll: (force?: boolean) => Promise<void>;

    // Invalidate cache
    invalidateCache: (key?: 'agents' | 'operations' | 'intel' | 'messages' | 'stats') => void;
}

const CACHE_DURATION = 60000; // 1 minute cache

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
    // Cache storage
    const [cache, setCache] = useState<{
        agents?: CacheEntry<Agent[]>;
        operations?: CacheEntry<Operation[]>;
        intel?: CacheEntry<Intel[]>;
        messages?: CacheEntry<{ data: Message[]; unread: number }>;
        stats?: CacheEntry<Stats>;
    }>({});

    // Data state
    const [agents, setAgents] = useState<Agent[]>([]);
    const [operations, setOperations] = useState<Operation[]>([]);
    const [intel, setIntel] = useState<Intel[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Loading states
    const [loading, setLoading] = useState({
        agents: false,
        operations: false,
        intel: false,
        messages: false,
        stats: false,
    });

    const isCacheValid = useCallback((timestamp?: number) => {
        if (!timestamp) return false;
        return Date.now() - timestamp < CACHE_DURATION;
    }, []);

    const fetchAgents = useCallback(async (force = false) => {
        if (!force && cache.agents && isCacheValid(cache.agents.timestamp)) {
            setAgents(cache.agents.data);
            return;
        }

        setLoading(prev => ({ ...prev, agents: true }));
        try {
            const res = await fetch('/api/agents');
            const data = await res.json();
            if (data.success) {
                setAgents(data.data);
                setCache(prev => ({
                    ...prev,
                    agents: { data: data.data, timestamp: Date.now() }
                }));
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
        } finally {
            setLoading(prev => ({ ...prev, agents: false }));
        }
    }, [cache.agents, isCacheValid]);

    const fetchOperations = useCallback(async (force = false) => {
        if (!force && cache.operations && isCacheValid(cache.operations.timestamp)) {
            setOperations(cache.operations.data);
            return;
        }

        setLoading(prev => ({ ...prev, operations: true }));
        try {
            const res = await fetch('/api/operations');
            const data = await res.json();
            if (data.success) {
                setOperations(data.data);
                setCache(prev => ({
                    ...prev,
                    operations: { data: data.data, timestamp: Date.now() }
                }));
            }
        } catch (error) {
            console.error('Error fetching operations:', error);
        } finally {
            setLoading(prev => ({ ...prev, operations: false }));
        }
    }, [cache.operations, isCacheValid]);

    const fetchIntel = useCallback(async (force = false) => {
        if (!force && cache.intel && isCacheValid(cache.intel.timestamp)) {
            setIntel(cache.intel.data);
            return;
        }

        setLoading(prev => ({ ...prev, intel: true }));
        try {
            const res = await fetch('/api/intel');
            const data = await res.json();
            if (data.success) {
                setIntel(data.data);
                setCache(prev => ({
                    ...prev,
                    intel: { data: data.data, timestamp: Date.now() }
                }));
            }
        } catch (error) {
            console.error('Error fetching intel:', error);
        } finally {
            setLoading(prev => ({ ...prev, intel: false }));
        }
    }, [cache.intel, isCacheValid]);

    const fetchMessages = useCallback(async (force = false) => {
        if (!force && cache.messages && isCacheValid(cache.messages.timestamp)) {
            setMessages(cache.messages.data.data);
            setUnreadCount(cache.messages.data.unread);
            return;
        }

        setLoading(prev => ({ ...prev, messages: true }));
        try {
            const res = await fetch('/api/messages');
            const data = await res.json();
            if (data.success) {
                setMessages(data.data);
                setUnreadCount(data.unread);
                setCache(prev => ({
                    ...prev,
                    messages: { data: { data: data.data, unread: data.unread }, timestamp: Date.now() }
                }));
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(prev => ({ ...prev, messages: false }));
        }
    }, [cache.messages, isCacheValid]);

    const fetchStats = useCallback(async (force = false) => {
        if (!force && cache.stats && isCacheValid(cache.stats.timestamp)) {
            setStats(cache.stats.data);
            return;
        }

        setLoading(prev => ({ ...prev, stats: true }));
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
                setCache(prev => ({
                    ...prev,
                    stats: { data: data.data, timestamp: Date.now() }
                }));
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(prev => ({ ...prev, stats: false }));
        }
    }, [cache.stats, isCacheValid]);

    const fetchAll = useCallback(async (force = false) => {
        await Promise.all([
            fetchStats(force),
            fetchAgents(force),
            fetchOperations(force),
            fetchIntel(force),
            fetchMessages(force),
        ]);
    }, [fetchStats, fetchAgents, fetchOperations, fetchIntel, fetchMessages]);

    const invalidateCache = useCallback((key?: 'agents' | 'operations' | 'intel' | 'messages' | 'stats') => {
        if (key) {
            setCache(prev => ({ ...prev, [key]: undefined }));
        } else {
            setCache({});
        }
    }, []);

    return (
        <DataContext.Provider value={{
            agents,
            operations,
            intel,
            messages,
            stats,
            unreadCount,
            loading,
            fetchAgents,
            fetchOperations,
            fetchIntel,
            fetchMessages,
            fetchStats,
            fetchAll,
            invalidateCache,
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
