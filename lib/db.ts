import { promises as fs } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

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

export interface Operation {
    id: string;
    name: string;
    status: string;
    progress: number;
    deadline: string;
    teamSize: number;
    createdAt: string;
}

export interface Intel {
    id: string;
    title: string;
    content: string | null;
    priority: string;
    source: string;
    createdAt: string;
}

export interface Message {
    id: string;
    fromAgent: string;
    toAgent: string;
    content: string;
    read: boolean;
    createdAt: string;
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
    messages: Message[];
    applications: Application[];
}

// Generate unique ID
export function generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Read database
export async function readDb(): Promise<Database> {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database:', error);
        return {
            agents: [],
            operations: [],
            intel: [],
            messages: [],
            applications: [],
        };
    }
}

// Write database
export async function writeDb(data: Database): Promise<void> {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper function to get relative time
export function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
}
