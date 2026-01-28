"use client";

import { Agent, Intel, News, Operation, Stats, VisitorLog } from '@/types';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';


interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

interface DataContextType {
    // Data
    agents: Agent[];
    operations: Operation[];
    intel: Intel[];
    news: News[];
    stats: Stats | null;
    unreadCount: number;
    visitors: VisitorLog[];

    // Loading states
    loading: {
        agents: boolean;
        operations: boolean;
        intel: boolean;
        stats: boolean;
        visitors: boolean;
        news: boolean;
    };

    // Fetch functions (with cache)
    fetchAgents: (force?: boolean) => Promise<void>;
    fetchOperations: (force?: boolean) => Promise<void>;
    fetchVisitors: (page?: number, setContext?: (data: any) => void, force?: boolean) => Promise<void>;
    fetchIntel: (force?: boolean) => Promise<void>;
    fetchNews: (force?: boolean) => Promise<void>;
    fetchStats: (force?: boolean) => Promise<void>;
    fetchAll: (force?: boolean) => Promise<void>;


    // Invalidate cache
    invalidateCache: (key?: 'agents' | 'operations' | 'intel' | 'news' | 'stats') => void;
}

const CACHE_DURATION = 60000; // 1 minute cache

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
    // Cache storage
    const [cache, setCache] = useState<{
        agents?: CacheEntry<Agent[]>;
        operations?: CacheEntry<Operation[]>;
        intel?: CacheEntry<Intel[]>;
        stats?: CacheEntry<Stats>;
        visitors?: CacheEntry<any>;
        news?: CacheEntry<News[]>;
    }>({});

    // Data state
    const [agents, setAgents] = useState<Agent[]>([]);
    const [operations, setOperations] = useState<Operation[]>([]);
    const [intel, setIntel] = useState<Intel[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [visitors, setVisitors] = useState<VisitorLog[]>([]);
    const [news, setNews] = useState<News[]>([]);

    // Loading states
    const [loading, setLoading] = useState({
        agents: false,
        operations: false,
        intel: false,
        news: false,
        stats: false,
        visitors: false,
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

    const fetchNews = useCallback(async (force = false) => {
        if (!force && cache.news && isCacheValid(cache.news.timestamp)) {
            setNews(cache.news.data);
            return;
        }

        setLoading(prev => ({ ...prev, news: true }));
        try {
            const res = await fetch('/api/news');
            const data = await res.json();
            if (data.success) {
                setNews(data.data);
                setCache(prev => ({
                    ...prev,
                    news: { data: data.data, timestamp: Date.now() }
                }));
            }
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(prev => ({ ...prev, news: false }));
        }
    }, [cache.news, isCacheValid]);

    const fetchVisitors = useCallback(async (page = 1, setContext?:(data: any) => void, force = false) => {
        if (!force && cache.visitors && isCacheValid(cache.visitors.timestamp)) {
            setVisitors(cache.visitors.data);
            return;
        }

        setLoading(prev => ({ ...prev, visitors: true }));
        try {
            const res = await fetch(`/api/visitors?page=${page}&limit=20`);
            const data = await res.json();
            if (data.success) {
                if(setContext) setContext(data.data);
                setCache(prev => ({
                    ...prev,
                    visitors: { data: data.data, timestamp: Date.now() }
                }));
            }
        } catch (error) {
            console.error('Error fetching visitors:', error);
        } finally {
            setLoading(prev => ({ ...prev, visitors: false }));
        }
    }, [cache.visitors, isCacheValid]);

    const fetchAll = useCallback(async (force = false) => {
        await Promise.all([
            fetchStats(force),
            fetchAgents(force),
            fetchOperations(force),
            fetchIntel(force),
            fetchVisitors(1, undefined, force),
        ]);
    }, [fetchStats, fetchAgents, fetchOperations, fetchIntel, fetchVisitors]);

    const invalidateCache = useCallback((key?: 'agents' | 'operations' | 'intel' | 'news' | 'stats') => {
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
            news,
            visitors,
            stats,
            unreadCount,
            loading,
            fetchAgents,
            fetchOperations,
            fetchIntel,
            fetchNews,
            fetchVisitors,
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
