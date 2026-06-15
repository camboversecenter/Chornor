
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, Mail, Plus, Trash2, RefreshCw, Key, Wallet, AlertCircle, Settings, ToggleLeft, ToggleRight, Database, Server, Copy, Loader2 } from 'lucide-react';
import { getAllUsersStats, getAdminList, addAdminEmail, removeAdminEmail, getWalletWhitelist, addToWalletWhitelist, removeFromWalletWhitelist, getGuestModeStatus, setGuestModeStatus, getAPIClients, createAPIClient, toggleAPIClientStatus, deleteAPIClient } from '../services/storageService';
import { APIClient } from '../types';
import { showConfirm, showAlert } from '../services/alertService';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<{ totalUsers: number, users: any[] }>({ totalUsers: 0, users: [] });
  const [admins, setAdmins] = useState<string[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [guestMode, setGuestMode] = useState(true);
  
  // API Clients
  const [apiClients, setApiClients] = useState<APIClient[]>([]);
  const [newClientName, setNewClientName] = useState('');
  const [lastGeneratedKey, setLastGeneratedKey] = useState('');
  
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newWhitelistEmail, setNewWhitelistEmail] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const loadData = async () => {
      setIsLoading(true);
      try {
          const [userStats, adminList, wl, gm, clients] = await Promise.all([
              getAllUsersStats(),
              getAdminList(),
              getWalletWhitelist(),
              getGuestModeStatus(),
              getAPIClients()
          ]);
          
          setStats(userStats);
          setAdmins(adminList);
          setWhitelist(wl);
          setGuestMode(gm);
          setApiClients(clients);
      } catch (e) {
          console.error("Failed to load admin data", e);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      loadData();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newAdminEmail) return;
      await addAdminEmail(newAdminEmail);
      setNewAdminEmail('');
      loadData();
  };

  const handleRemoveAdmin = async (email: string) => {
      const confirmed = await showConfirm("ដកសិទ្ធិ Admin? (Remove Admin?)", `Remove admin rights from ${email}?`);
      if(confirmed) {
          await removeAdminEmail(email);
          loadData();
      }
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newWhitelistEmail) return;
      await addToWalletWhitelist(newWhitelistEmail);
      setNewWhitelistEmail('');
      loadData();
  };

  const handleRemoveWhitelist = async (email: string) => {
      const confirmed = await showConfirm("ដក Whitelist? (Remove Whitelist?)", `Remove ${email} from Wallet Whitelist? They will lose access to connect.`);
      if(confirmed) {
          await removeFromWalletWhitelist(email);
          loadData();
      }
  };

  const toggleGuestMode = async () => {
      setIsToggling(true);
      const newState = !guestMode;
      
      try {
          // Optimistic update
          setGuestMode(newState);
          
          // Perform DB update (Throws if failed)
          await setGuestModeStatus(newState);
          
          // Success: No need to verify.
      } catch (e: any) {
          console.error("Toggle error", e);
          setGuestMode(!newState); // Revert
          showAlert("បរាជ័យ (Update Failed)", e.message || "An unexpected error occurred.", "error");
      } finally {
          setIsToggling(false);
      }
  };

  const handleCreateAPI = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newClientName) return;
      const key = await createAPIClient(newClientName);
      setLastGeneratedKey(key);
      setNewClientName('');
      loadData();
  };

  const handleToggleAPI = async (id: string, status: boolean) => {
      await toggleAPIClientStatus(id, status);
      loadData();
  };
  
  const handleDeleteAPI = async (id: string) => {
      const confirmed = await showConfirm("លុប API Key? (Revoke API Key?)", "Revoke this API Key permanently?");
      if(confirmed) {
          await deleteAPIClient(id);
          loadData();
      }
  }

  return (
    <div className="pb-24">
        <div className="bg-slate-900 text-white p-6 rounded-b-3xl -mx-4 mb-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldCheck className="text-indigo-400" />
                        Admin Panel
                    </h2>
                    <p className="text-slate-400 text-sm">System Overview</p>
                </div>
                <button onClick={loadData} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 text-indigo-400 mb-1">
                        <Users size={18} />
                        <span className="text-xs font-bold uppercase">Total Users</span>
                    </div>
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                     <div className="flex items-center gap-2 text-green-400 mb-1">
                        <Server size={18} />
                        <span className="text-xs font-bold uppercase">Active APIs</span>
                    </div>
                    <p className="text-3xl font-bold">{apiClients.filter(c => c.isActive).length}</p>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            
            {/* System Settings */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Settings size={18} className="text-slate-600" />
                    System Settings
                </h3>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                        <p className="font-bold text-gray-700 text-sm">Guest Mode / Test Function</p>
                        <p className="text-xs text-gray-500">Allow users to try the app without logging in.</p>
                        <p className="text-[10px] text-orange-500 mt-1">If OFF, login button is hidden for everyone.</p>
                    </div>
                    <button 
                        onClick={toggleGuestMode} 
                        disabled={isToggling}
                        className={`text-2xl transition-colors ${guestMode ? 'text-green-500' : 'text-gray-300'} disabled:opacity-50`}
                    >
                        {isToggling ? <Loader2 className="animate-spin" size={24} /> : (guestMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />)}
                    </button>
                </div>
            </div>

            {/* API Client Management (Third Party) */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-indigo-600">
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Database size={18} className="text-indigo-600" /> 
                    Third Party Apps (API)
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                    Manage API keys for external applications (e.g. Grab, PassApp) to post transactions.
                </p>

                {lastGeneratedKey && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl animate-in fade-in">
                        <p className="text-xs text-green-800 font-bold mb-1">New API Key Generated:</p>
                        <div className="flex items-center gap-2">
                            <code className="bg-white px-2 py-1 rounded border border-green-200 text-green-700 font-mono text-xs flex-1 break-all">
                                {lastGeneratedKey}
                            </code>
                            <button onClick={() => navigator.clipboard.writeText(lastGeneratedKey)} className="text-green-600 hover:text-green-800">
                                <Copy size={16} />
                            </button>
                        </div>
                        <p className="text-[10px] text-green-600 mt-1">Copy this now. It will not be shown again.</p>
                    </div>
                )}

                <form onSubmit={handleCreateAPI} className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        required
                        placeholder="App Name (e.g. Grab Integration)"
                        value={newClientName}
                        onChange={e => setNewClientName(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button type="submit" className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700 text-sm font-bold">
                        Generate Key
                    </button>
                </form>

                <div className="space-y-2">
                    {apiClients.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 italic py-2">No API Clients registered.</p>
                    ) : (
                        apiClients.map(client => (
                            <div key={client.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-800 text-sm">{client.name}</p>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${client.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {client.isActive ? 'Active' : 'Revoked'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {client.id.slice(0, 8)}...</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleToggleAPI(client.id, client.isActive)}
                                        className={`p-1.5 rounded-md text-xs font-bold transition-colors ${client.isActive ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                    >
                                        {client.isActive ? 'Disable' : 'Enable'}
                                    </button>
                                    <button onClick={() => handleDeleteAPI(client.id)} className="text-gray-400 hover:text-red-500 p-1">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Wallet Whitelist Management */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Wallet size={18} className="text-indigo-600" /> 
                    Wallet Access Whitelist
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                    Users listed here are allowed to generate a Wallet key. Non-whitelisted users will see an alert.
                </p>

                <form onSubmit={handleAddWhitelist} className="flex gap-2 mb-4">
                    <input 
                        type="email" 
                        required
                        placeholder="User Email (e.g. user@gmail.com)"
                        value={newWhitelistEmail}
                        onChange={e => setNewWhitelistEmail(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700">
                        <Plus size={20} />
                    </button>
                </form>

                <div className="space-y-1 max-h-48 overflow-y-auto">
                    {whitelist.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 italic py-2">No whitelisted users yet.</p>
                    ) : (
                        whitelist.map(email => (
                            <div key={email} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <span className={`w-2 h-2 rounded-full bg-green-500`}></span>
                                    <span className="text-sm text-gray-700 truncate">{email}</span>
                                </div>
                                <button onClick={() => handleRemoveWhitelist(email)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* User Directory */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Users size={18} /> User Directory
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {stats.users.length === 0 ? (
                        <p className="text-gray-400 text-sm">No registered users found.</p>
                    ) : (
                        stats.users.map((u, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 border-b border-gray-50 last:border-0">
                                {u.photo ? (
                                    <img src={u.photo} className="w-8 h-8 rounded-full" alt="u" />
                                ) : (
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                        {u.name?.charAt(0)}
                                    </div>
                                )}
                                <div className="overflow-hidden">
                                    <p className="font-bold text-sm text-gray-800 truncate">{u.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                </div>
                                <div className="ml-auto text-[10px] text-gray-400">
                                    {new Date(u.lastLogin).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Admin Management */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm opacity-80">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <ShieldCheck size={18} /> Manage Admins
                </h3>
                
                <form onSubmit={handleAddAdmin} className="flex gap-2 mb-4">
                    <input 
                        type="email" 
                        required
                        placeholder="New Admin Email"
                        value={newAdminEmail}
                        onChange={e => setNewAdminEmail(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button type="submit" className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700">
                        <Plus size={20} />
                    </button>
                </form>

                <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-indigo-600" />
                            <span className="text-sm font-bold text-indigo-700">sengtha@gmail.com</span>
                        </div>
                        <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">Super Admin</span>
                    </div>
                    {admins.map(email => (
                         <div key={email} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-gray-400" />
                                <span className="text-sm text-gray-700">{email}</span>
                            </div>
                            <button onClick={() => handleRemoveAdmin(email)} className="text-gray-400 hover:text-red-500">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminDashboard;
