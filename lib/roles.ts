// Role-based permissions
export type Role = 'ADMIN' | 'SENIOR_AGENT' | 'AGENT' | 'VIEWER';

export interface Permission {
    canViewAgents: boolean;
    canManageAgents: boolean;
    canViewOperations: boolean;
    canManageOperations: boolean;
    canViewIntel: boolean;
    canSubmitIntel: boolean;
    canViewMessages: boolean;
    canSendMessages: boolean;
    canManageUsers: boolean;
    canAccessSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, Permission> = {
    ADMIN: {
        canViewAgents: true,
        canManageAgents: true,
        canViewOperations: true,
        canManageOperations: true,
        canViewIntel: true,
        canSubmitIntel: true,
        canViewMessages: true,
        canSendMessages: true,
        canManageUsers: true,
        canAccessSettings: true,
    },
    SENIOR_AGENT: {
        canViewAgents: true,
        canManageAgents: false,
        canViewOperations: true,
        canManageOperations: true,
        canViewIntel: true,
        canSubmitIntel: true,
        canViewMessages: true,
        canSendMessages: true,
        canManageUsers: false,
        canAccessSettings: true,
    },
    AGENT: {
        canViewAgents: true,
        canManageAgents: false,
        canViewOperations: true,
        canManageOperations: false,
        canViewIntel: true,
        canSubmitIntel: true,
        canViewMessages: true,
        canSendMessages: true,
        canManageUsers: false,
        canAccessSettings: false,
    },
    VIEWER: {
        canViewAgents: true,
        canManageAgents: false,
        canViewOperations: true,
        canManageOperations: false,
        canViewIntel: true,
        canSubmitIntel: false,
        canViewMessages: false,
        canSendMessages: false,
        canManageUsers: false,
        canAccessSettings: false,
    },
};

export function getPermissions(role: Role): Permission {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.VIEWER;
}

export function hasPermission(role: Role, permission: keyof Permission): boolean {
    return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

export const ROLE_LABELS: Record<Role, string> = {
    ADMIN: 'Administrator',
    SENIOR_AGENT: 'Senior Agent',
    AGENT: 'Agent',
    VIEWER: 'Viewer',
};

export const ROLE_COLORS: Record<Role, string> = {
    ADMIN: 'bg-red-500/20 text-red-400',
    SENIOR_AGENT: 'bg-purple-500/20 text-purple-400',
    AGENT: 'bg-blue-500/20 text-blue-400',
    VIEWER: 'bg-zinc-500/20 text-zinc-400',
};
