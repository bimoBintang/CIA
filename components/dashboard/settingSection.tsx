"use client";


export function SettingsSection() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-2">Settings</h1>
                <p className="text-zinc-500">Manage your account and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Agent Codename</label>
                            <input type="text" defaultValue="Agent Alpha" className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none cursor-not-allowed opacity-60" readOnly />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Email</label>
                            <input type="email" defaultValue="alpha@circle-cia.id" className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Faculty</label>
                            <input type="text" defaultValue="Fakultas Teknik" className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" />
                        </div>
                        <button className="btn-primary w-full">Save Changes</button>
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Security</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30">
                            <div>
                                <p className="font-medium">Two-Factor Authentication</p>
                                <p className="text-sm text-zinc-500">Extra layer of security</p>
                            </div>
                            <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30">
                            <div>
                                <p className="font-medium">Encrypted Messages</p>
                                <p className="text-sm text-zinc-500">End-to-end encryption</p>
                            </div>
                            <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30">
                            <div>
                                <p className="font-medium">Activity Alerts</p>
                                <p className="text-sm text-zinc-500">Get notified of suspicious activity</p>
                            </div>
                            <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}