// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Tomorrow Rich Together
import {
    Category, Transaction, Family, Currency, Lending, LendingTransaction,
    Saving, SavingTransaction, Budget, CryptoAsset, CryptoTransaction,
    CommunityPost, PostType, ReactionType, UserProfile,
    TransactionRequest, APIClient
} from '../types';
import {
    INITIAL_CATEGORIES, INITIAL_FAMILY, INITIAL_TRANSACTIONS,
    INITIAL_LENDINGS, INITIAL_SAVINGS, INITIAL_BUDGETS, INITIAL_CRYPTO_ASSETS,
    INITIAL_POSTS, INITIAL_CRYPTO_TRANSACTIONS, EXCHANGE_RATE
} from '../constants';
import { supabase } from './supabaseClient';
import { showAlert } from './alertService';

// --- STATE MANAGEMENT ---

interface AppState {
    categories: Category[];
    transactions: Transaction[];
    familyMembers: Family[];
    preferredCurrency: Currency;
    lendings: Lending[];
    lendingTransactions: LendingTransaction[];
    savings: Saving[];
    savingTransactions: SavingTransaction[];
    budgets: Budget[];
    cryptoAssets: CryptoAsset[];
    cryptoTransactions: CryptoTransaction[];
    communityPosts: CommunityPost[];
    transactionRequests: TransactionRequest[];
    aiDailyPosts: Record<string, string>; // date-type string
    apiClients: APIClient[];
    guestMode: boolean; // Global Config
    adminEmails: string[];
    walletWhitelist: string[];
}

const LOCAL_STORAGE_KEY = 'chornor_data_v1';

let state: AppState = {
    categories: [],
    transactions: [],
    familyMembers: [],
    preferredCurrency: 'KHR',
    lendings: [],
    lendingTransactions: [],
    savings: [],
    savingTransactions: [],
    budgets: [],
    cryptoAssets: [],
    cryptoTransactions: [],
    communityPosts: [],
    transactionRequests: [],
    aiDailyPosts: {},
    apiClients: [],
    guestMode: true,
    adminEmails: ['sengtha@gmail.com'], // Fallback super admin
    walletWhitelist: []
};

let currentUserId: string | null = null;
let isOfflineMode: boolean = false;
let currentUserProfile: UserProfile | null = null;
let realtimeChannel: any = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

type DataChangeListener = () => void;
const dataChangeListeners = new Set<DataChangeListener>();

// --- HELPERS FOR SUPABASE SYNC ---

const isCloudUser = () => currentUserId && !currentUserId.startsWith('local_') && !isOfflineMode;

const notifyDataChanged = () => {
    dataChangeListeners.forEach(listener => listener());
};

export const subscribeToDataChanges = (listener: DataChangeListener) => {
    dataChangeListeners.add(listener);
    return () => {
        dataChangeListeners.delete(listener);
    };
};

// Generic Fetch
const fetchTable = async <T>(tableName: string, mapFn?: (data: any) => T, filterByUser: boolean = true): Promise<T[]> => {
    if (!isCloudUser()) return [];
    
    let query = supabase.from(tableName).select('*');
    if (filterByUser) {
        query = query.eq('user_id', currentUserId);
    }

    const { data, error } = await query;
    if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        throw error; // Propagate error to trigger fallback
    }
    // If a map function is provided, use it, otherwise cast raw data
    return mapFn ? data.map(mapFn) : (data as unknown as T[]);
};

// Generic Upsert
const upsertTable = async (tableName: string, record: any, attachUserId: boolean = true) => {
    if (!isCloudUser()) return;
    // Ensure user_id is attached to record only if requested
    const payload = attachUserId ? { ...record, user_id: currentUserId } : record;
    const { error } = await supabase.from(tableName).upsert(payload, { onConflict: '_id' }); 
    if (error) console.error(`Error saving to ${tableName}:`, error);
};

// Generic Delete
const deleteFromTable = async (tableName: string, id: string) => {
    if (!isCloudUser()) return;
    const { error } = await supabase.from(tableName).delete().eq('_id', id);
    if (error) console.error(`Error deleting from ${tableName}:`, error);
};

// --- DATA MAPPERS ---
const mapAPIClient = (data: any): APIClient => ({
    id: data.id,
    name: data.name,
    apiKey: data.api_key,
    isActive: data.is_active,
    createdAt: data.created_at,
    requestsCount: data.requests_count || 0
});

// --- INITIALIZATION ---

export const getSystemConfig = async (): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'guest_mode')
            .single();
        
        if (error || !data) return true; // Default to true if config missing
        // Store in local state as well for faster access
        state.guestMode = data.value === true;
        return data.value === true;
    } catch (e) {
        return true; // Default to true on network fail
    }
};

const getAdminEmailsFromDB = async (): Promise<string[]> => {
    if (!isCloudUser()) return ['sengtha@gmail.com'];
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'admin_emails')
            .single();
        if (error || !data || !Array.isArray(data.value)) return ['sengtha@gmail.com'];
        return data.value as string[];
    } catch (e) {
        return ['sengtha@gmail.com'];
    }
};

export const setGuestModeStatus = async (enabled: boolean) => {
    // 1. Optimistic Local Update
    state.guestMode = enabled;
    saveToLocal(); 
    
    // 2. Sync to Cloud
    if (isCloudUser()) {
        const { error } = await supabase.from('app_settings').upsert({ key: 'guest_mode', value: enabled });
        if (error) {
            // Revert local state if cloud sync fails
            state.guestMode = !enabled;
            saveToLocal();
            throw error;
        }
    }
};

export const initializeData = async (user: UserProfile) => {
    currentUserId = user.id;
    currentUserProfile = user;
    
    // Always load local cache first to restore preferences (Currency, etc.)
    // For Cloud users, data arrays will be overwritten by DB fetch below.
    loadFromLocalStorage(user.id);

    const isTestUser = user.isTestUser;

    if (isTestUser) {
        // --- LOCAL STORAGE MODE ---
        isOfflineMode = true;
        if (state.categories.length === 0) loadMocks();
    } else {
        // --- SUPABASE CLOUD MODE ---
        isOfflineMode = false;
        try {
            // TEST CONNECTION FIRST
            const { error: pingError } = await supabase.from('app_settings').select('key').limit(1);
            if (pingError) {
                if (pingError.code === '42P01') {
                    throw new Error("Tables not found. Please run the SQL Script in Supabase.");
                } else if (pingError.code === 'PGRST301' || pingError.message.includes('JWT')) {
                     throw new Error("Authentication failed. Please check your API Key (Anon Key).");
                }
                throw pingError;
            }

            await refreshCloudData(true);

        } catch (e: any) {
            console.error("Critical: Failed to load Cloud Data. Falling back to local cache.", e);
            
            await showAlert(
                 "បរាជ័យក្នុងការតភ្ជាប់ (Connection Failed)", 
                 `មិនអាចតភ្ជាប់ទៅកាន់ទិន្នន័យបានទេ។ (Could not connect to database) ${e.message}`, 
                 "error"
            );

            // Fallback to local storage if Cloud fails (Offline support)
            isOfflineMode = true;
            // loadFromLocalStorage already called at top
            if (state.categories.length === 0) loadMocks();
        }
    }
};

export const refreshCloudData = async (seedCategories = false) => {
    if (!isCloudUser() || !currentUserProfile) return;

    const [
        cats, txs, fams, loans, loanTxs, saves, saveTxs, budgets, cryptos, cryptoTxs, posts, reqs, clients, whitelist, admins
    ] = await Promise.all([
        fetchTable<Category>('categories'),
        fetchTable<Transaction>('transactions'),
        fetchTable<Family>('family_members'),
        fetchTable<Lending>('lendings'),
        fetchTable<LendingTransaction>('lending_transactions'),
        fetchTable<Saving>('savings'),
        fetchTable<SavingTransaction>('saving_transactions'),
        fetchTable<Budget>('budgets'),
        fetchTable<CryptoAsset>('crypto_assets'),
        fetchTable<CryptoTransaction>('crypto_transactions'),
        fetchTable<CommunityPost>('community_posts', undefined, false),
        fetchTable<TransactionRequest>('transaction_requests'),
        fetchTable<APIClient>('api_clients', mapAPIClient, false),
        fetchTable<{email: string}>('wallet_whitelist', undefined, false),
        getAdminEmailsFromDB()
    ]);

    if (seedCategories && cats.length === 0) {
        const seedCategories = INITIAL_CATEGORIES.map((c, index) => ({
            ...c,
            _id: `cat_${Date.now()}_${index}`,
            user_id: currentUserProfile!.id
        }));

        const { error: seedError } = await supabase.from('categories').insert(seedCategories);

        if (!seedError) {
            state.categories = seedCategories;
        } else {
            console.error("Failed to seed default categories:", seedError);
            state.categories = [...INITIAL_CATEGORIES];
        }
    } else {
        state.categories = cats.length ? cats : state.categories;
    }

    state.transactions = txs;
    state.familyMembers = fams.length ? fams : [{ _id: 'me', name: currentUserProfile.name }];
    state.lendings = loans;
    state.lendingTransactions = loanTxs;
    state.savings = saves;
    state.savingTransactions = saveTxs;
    state.budgets = budgets;
    state.cryptoAssets = cryptos;
    state.cryptoTransactions = cryptoTxs;
    state.transactionRequests = reqs;
    state.apiClients = clients;
    state.walletWhitelist = whitelist.map(w => w.email);
    state.adminEmails = admins.length > 0 ? admins : ['sengtha@gmail.com'];
    state.communityPosts = [...INITIAL_POSTS, ...posts];

    await getSystemConfig();
    saveToLocal();
    notifyDataChanged();
};

export const subscribeToRealtimeUpdates = () => {
    if (!isCloudUser()) return () => {};

    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
    }

    const tables = [
        'categories',
        'transactions',
        'family_members',
        'lendings',
        'lending_transactions',
        'savings',
        'saving_transactions',
        'budgets',
        'crypto_assets',
        'crypto_transactions',
        'community_posts',
        'transaction_requests',
        'app_settings',
        'api_clients',
        'wallet_whitelist'
    ];

    realtimeChannel = supabase.channel(`chornor-realtime-${currentUserId}`);
    tables.forEach(table => {
        realtimeChannel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
            if (refreshTimer) clearTimeout(refreshTimer);
            refreshTimer = setTimeout(() => {
                refreshCloudData().catch(error => console.error('Realtime refresh failed:', error));
            }, 250);
        });
    });
    realtimeChannel.subscribe();

    return () => {
        if (refreshTimer) clearTimeout(refreshTimer);
        refreshTimer = null;
        if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }
    };
};

const loadFromLocalStorage = (uid: string) => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${uid}`);
    if (local) {
        try {
            const parsed = JSON.parse(local);
            state = { ...state, ...parsed };
        } catch (e) { console.error("Local load error", e); }
    }
}

const loadMocks = () => {
    state.categories = [...INITIAL_CATEGORIES];
    state.transactions = [...INITIAL_TRANSACTIONS];
    state.familyMembers = [...INITIAL_FAMILY];
    state.lendings = [...INITIAL_LENDINGS];
    state.savings = [...INITIAL_SAVINGS];
    state.budgets = [...INITIAL_BUDGETS];
    state.cryptoAssets = [...INITIAL_CRYPTO_ASSETS];
    state.cryptoTransactions = [...INITIAL_CRYPTO_TRANSACTIONS];
    state.communityPosts = [...INITIAL_POSTS];
}

const saveToLocal = () => {
    // We always save to local as a cache/backup, even for cloud users
    if (currentUserId) {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_${currentUserId}`, JSON.stringify(state));
    }
};

// --- GETTERS & SETTERS (Updated with Sync Logic) ---

// Categories
export const getCategories = () => state.categories;
export const saveCategory = async (cat: Category) => {
    const idx = state.categories.findIndex(c => c._id === cat._id);
    if (idx >= 0) state.categories[idx] = cat;
    else state.categories.push(cat);
    
    saveToLocal();
    await upsertTable('categories', cat);
};
export const deleteCategory = async (id: string) => {
    const used = state.transactions.some(t => t.categoryId === id);
    if (used) return { success: false, error: "Category is in use by transactions." };
    state.categories = state.categories.filter(c => c._id !== id);
    
    saveToLocal();
    await deleteFromTable('categories', id);
    return { success: true };
};

// Transactions
export const getTransactions = () => state.transactions;
export const saveTransaction = async (tx: Transaction) => {
    const idx = state.transactions.findIndex(t => t._id === tx._id);
    if (idx >= 0) state.transactions[idx] = tx;
    else state.transactions.push(tx);
    
    saveToLocal();
    await upsertTable('transactions', tx);
};
export const deleteTransaction = async (id: string) => {
    state.transactions = state.transactions.filter(t => t._id !== id);
    
    saveToLocal();
    await deleteFromTable('transactions', id);
};

// Family
export const getFamilyMembers = () => state.familyMembers;
export const saveFamilyMembers = async (members: Family[]) => {
    state.familyMembers = members;
    saveToLocal();
    // Saving array is tricky with upsertTable single record pattern. 
    // For simplicity in this demo, we'll iterate. Real app should use bulk upsert.
    if(isCloudUser()) {
        const { error } = await supabase.from('family_members').upsert(members.map(m => ({ ...m, user_id: currentUserId })));
        if (error) console.error("Error saving family", error);
    }
};
export const deleteFamilyMember = async (id: string) => {
    const used = state.transactions.some(t => t.familyId === id);
    if (used) return { success: false, error: "Member has associated transactions." };
    state.familyMembers = state.familyMembers.filter(m => m._id !== id);
    
    saveToLocal();
    await deleteFromTable('family_members', id);
    return { success: true };
};

// Currency (Preference stored in LocalStorage for now, or user profile)
export const getPreferredCurrency = () => state.preferredCurrency;
export const savePreferredCurrency = (c: Currency) => {
    state.preferredCurrency = c;
    saveToLocal();
    // Ideally sync to 'user_profiles' table
};

// Lending
export const getLendings = () => state.lendings;
export const saveLending = async (l: Lending) => {
    const idx = state.lendings.findIndex(i => i._id === l._id);
    if (idx >= 0) state.lendings[idx] = l;
    else state.lendings.push(l);
    
    saveToLocal();
    await upsertTable('lendings', l);
};
export const deleteLending = async (id: string) => {
    state.lendings = state.lendings.filter(l => l._id !== id);
    state.lendingTransactions = state.lendingTransactions.filter(t => t.lendingId !== id);
    
    saveToLocal();
    await deleteFromTable('lendings', id);
    // Also delete related transactions from DB
    if(isCloudUser()) await supabase.from('lending_transactions').delete().eq('lendingId', id); 
    
    return { success: true };
};
export const getLendingTransactions = () => state.lendingTransactions;
export const getTransactionsByLendingId = (id: string) => state.lendingTransactions.filter(t => t.lendingId === id);
export const saveLendingTransaction = async (tx: LendingTransaction) => {
    const idx = state.lendingTransactions.findIndex(t => t._id === tx._id);
    if (idx >= 0) state.lendingTransactions[idx] = tx;
    else state.lendingTransactions.push(tx);
    
    saveToLocal();
    await upsertTable('lending_transactions', tx);
};
export const generateLoanSchedule = async (l: Lending) => {
    const txs: LendingTransaction[] = [];
    const principalRiel = (l.amountRiel - l.downRiel) / l.paymentMonths;
    const principalDollar = (l.amountDollar - l.downDollar) / l.paymentMonths;
    
    for(let i=1; i<=l.paymentMonths; i++) {
        const dueDate = new Date(l.createdAt);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        const interestRiel = (l.amountRiel - l.downRiel) * (l.interestRate / 100);
        const interestDollar = (l.amountDollar - l.downDollar) * (l.interestRate / 100);

        txs.push({
            _id: `sch_${l._id}_${i}`,
            lendingId: l._id,
            month: i,
            dueDate: dueDate.toISOString(),
            amountRiel: principalRiel + interestRiel,
            amountDollar: principalDollar + interestDollar,
            interestRiel,
            interestDollar,
            principalRiel,
            principalDollar,
            balanceRiel: (l.amountRiel - l.downRiel) - (principalRiel * i),
            balanceDollar: (l.amountDollar - l.downDollar) - (principalDollar * i),
            isPaid: false
        });
    }
    state.lendingTransactions = [...state.lendingTransactions, ...txs];
    
    saveToLocal();
    // Bulk insert if cloud
    if(isCloudUser()) {
        const payload = txs.map(t => ({ ...t, user_id: currentUserId }));
        await supabase.from('lending_transactions').insert(payload);
    }
};

// Savings
export const getSavings = () => state.savings;
export const saveSaving = async (s: Saving) => {
    const idx = state.savings.findIndex(i => i._id === s._id);
    if (idx >= 0) state.savings[idx] = s;
    else state.savings.push(s);
    
    saveToLocal();
    await upsertTable('savings', s);
};
export const deleteSaving = async (id: string) => {
    state.savings = state.savings.filter(s => s._id !== id);
    state.savingTransactions = state.savingTransactions.filter(t => t.savingId !== id);
    
    saveToLocal();
    await deleteFromTable('savings', id);
    if(isCloudUser()) await supabase.from('saving_transactions').delete().eq('savingId', id);
};
export const getSavingTransactions = (id?: string) => {
    if (id) return state.savingTransactions.filter(t => t.savingId === id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return state.savingTransactions;
};
export const saveSavingTransaction = async (tx: SavingTransaction) => {
    state.savingTransactions.push(tx);
    const s = state.savings.find(i => i._id === tx.savingId);
    if (s) {
        s.savedRiel += tx.amountRiel;
        s.savedDollar += tx.amountDollar;
        saveSaving(s); // Saves parent
    }
    saveToLocal();
    await upsertTable('saving_transactions', tx);
};
export const deleteSavingTransaction = async (id: string) => {
    const tx = state.savingTransactions.find(t => t._id === id);
    if (tx) {
        const s = state.savings.find(i => i._id === tx.savingId);
        if (s) {
            s.savedRiel -= tx.amountRiel;
            s.savedDollar -= tx.amountDollar;
            saveSaving(s);
        }
        state.savingTransactions = state.savingTransactions.filter(t => t._id !== id);
        
        saveToLocal();
        await deleteFromTable('saving_transactions', id);
    }
};

// Budgets
export const getBudgets = () => state.budgets;
export const saveBudget = async (b: Budget) => {
    const idx = state.budgets.findIndex(i => i._id === b._id);
    if (idx >= 0) state.budgets[idx] = b;
    else state.budgets.push(b);

    saveToLocal();
    await upsertTable('budgets', b);
};
export const deleteBudget = async (id: string) => {
    state.budgets = state.budgets.filter(b => b._id !== id);

    saveToLocal();
    await deleteFromTable('budgets', id);
};

// Sum of expenses for a category in the given month (defaults to the current
// month), normalized to the requested currency using the reference exchange rate.
export const getMonthlyCategorySpend = (categoryId: string, currency: Currency, ref: Date = new Date()): number => {
    const month = ref.getMonth();
    const year = ref.getFullYear();
    return state.transactions
        .filter(t => t.categoryId === categoryId)
        .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((sum, t) => {
            if (currency === 'USD') {
                return sum + (t.currency === 'USD' ? t.amount : t.amount / EXCHANGE_RATE);
            }
            return sum + (t.currency === 'KHR' ? t.amount : t.amount * EXCHANGE_RATE);
        }, 0);
};

// Crypto
export const getCryptoAssets = () => state.cryptoAssets;
export const saveCryptoAsset = async (a: CryptoAsset) => {
    const idx = state.cryptoAssets.findIndex(i => i._id === a._id);
    if (idx >= 0) state.cryptoAssets[idx] = a;
    else state.cryptoAssets.push(a);
    
    saveToLocal();
    await upsertTable('crypto_assets', a);
};
export const deleteCryptoAsset = async (id: string) => {
    state.cryptoAssets = state.cryptoAssets.filter(a => a._id !== id);
    state.cryptoTransactions = state.cryptoTransactions.filter(t => t.assetId !== id);
    
    saveToLocal();
    await deleteFromTable('crypto_assets', id);
    if(isCloudUser()) await supabase.from('crypto_transactions').delete().eq('assetId', id);
    return { success: true };
};
export const updateCryptoAssetPrices = (priceMap: Record<string, number>) => { 
    state.cryptoAssets = state.cryptoAssets.map(a => {
        if (a.coingeckoId && priceMap[a.coingeckoId]) {
            return { ...a, currentPrice: priceMap[a.coingeckoId] };
        }
        return a;
    });
    saveToLocal();
};
export const getCryptoTransactions = (assetId: string) => state.cryptoTransactions.filter(t => t.assetId === assetId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
export const addCryptoTransaction = async (tx: CryptoTransaction) => {
    state.cryptoTransactions.push(tx);
    const asset = state.cryptoAssets.find(a => a._id === tx.assetId);
    if (asset) {
        if (tx.type === 'BUY') {
            const totalCost = (asset.quantity * asset.averageBuyPrice) + (tx.quantity * tx.price);
            const totalQty = asset.quantity + tx.quantity;
            asset.averageBuyPrice = totalQty > 0 ? totalCost / totalQty : 0;
            asset.quantity = totalQty;
        } else {
            asset.quantity = Math.max(0, asset.quantity - tx.quantity);
        }
        saveCryptoAsset(asset);
    }
    saveToLocal();
    await upsertTable('crypto_transactions', tx);
};
export const deleteCryptoTransaction = async (id: string) => {
    state.cryptoTransactions = state.cryptoTransactions.filter(t => t._id !== id);
    saveToLocal();
    await deleteFromTable('crypto_transactions', id);
};

// Community
export const getCommunityPosts = (page: number, limit: number) => {
    // Pagination logic locally
    const start = (page - 1) * limit;
    const sorted = [...state.communityPosts].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return {
        posts: sorted.slice(start, start + limit),
        total: sorted.length
    };
};
export const addCommunityPost = async (post: CommunityPost) => {
    state.communityPosts.unshift(post);
    saveToLocal();
    await upsertTable('community_posts', post, false); // No User ID check on posts for now
};
export const reactToCommunityPost = async (id: string, type: ReactionType) => {
    const post = state.communityPosts.find(p => p._id === id);
    if (post) {
        const oldReaction = post.userReaction;
        if (oldReaction === type) {
            post.userReaction = null;
            post.reactions[type] = Math.max(0, (post.reactions[type] || 0) - 1);
        } else {
            if (oldReaction) post.reactions[oldReaction] = Math.max(0, (post.reactions[oldReaction] || 0) - 1);
            post.userReaction = type;
            post.reactions[type] = (post.reactions[type] || 0) + 1;
        }
        saveToLocal();
        await upsertTable('community_posts', post, false);
    }
};

// AI Daily Post Tracking
export const hasAIPostedToday = (type: PostType): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return state.aiDailyPosts[`${today}_${type}`] === 'true';
};
export const markAIPostedToday = (type: PostType) => {
    const today = new Date().toISOString().split('T')[0];
    state.aiDailyPosts[`${today}_${type}`] = 'true';
    saveToLocal();
};

// Transaction Requests
export const getTransactionRequests = () => state.transactionRequests;
export const approveTransactionRequest = async (req: TransactionRequest, categoryId: string, familyId?: string) => {
    const newTx: Transaction = {
        _id: `approved_${req._id}`,
        categoryId: categoryId,
        familyId: familyId || undefined,
        amount: req.amount,
        currency: req.currency,
        date: req.date,
        createdAt: new Date().toISOString(),
        description: `${req.description} (via ${req.sourceAppName})`,
        reminder: 'NONE'
    };

    saveTransaction(newTx);

    state.transactionRequests = state.transactionRequests.filter(r => r._id !== req._id);
    saveToLocal();

    if (isCloudUser()) {
        try {
            await supabase.from('transaction_requests').update({ status: 'APPROVED' }).eq('id', req._id); // Assuming DB key is id
        } catch(e) { console.error("Supabase sync error", e); }
    }
};
export const rejectTransactionRequest = async (id: string) => {
    state.transactionRequests = state.transactionRequests.filter(r => r._id !== id);
    saveToLocal();
    if (isCloudUser()) {
         try {
            await supabase.from('transaction_requests').update({ status: 'REJECTED' }).eq('id', id);
        } catch(e) { console.error("Supabase sync error", e); }
    }
};
export const mockReceiveExternalRequest = (appName: string) => {
    const req: TransactionRequest = {
        _id: `req_${Date.now()}`,
        sourceAppId: 'mock_app_id',
        sourceAppName: appName,
        amount: parseFloat((Math.random() * 20 + 2).toFixed(2)),
        currency: 'USD',
        description: `Ride to Office`,
        date: new Date().toISOString(),
        status: 'PENDING',
        createdAt: new Date().toISOString()
    };
    state.transactionRequests.push(req);
    saveToLocal();
};

// ADMIN
export const getGuestModeStatus = async () => {
    // Force refresh from DB if possible
    const dbMode = await getSystemConfig();
    return dbMode;
};

export const getAllUsersStats = async () => {
    if (!isCloudUser()) {
        // Fallback for offline dev
        const whitelist = state.walletWhitelist;
        return {
            totalUsers: whitelist.length,
            users: whitelist.map((email, idx) => ({
                name: email.split('@')[0],
                email: email,
                lastLogin: new Date().toISOString(),
                photo: null
            }))
        };
    }

    try {
        const { data, error } = await supabase.functions.invoke('admin-action', {
            body: { action: 'GET_USER_STATS' }
        });

        if (error) throw error;
        return {
            totalUsers: data.totalUsers,
            users: data.users
        };
    } catch (e) {
        console.error("Failed to fetch real user stats", e);
        // Fallback to whitelist display if API fails
        const whitelist = state.walletWhitelist;
        return {
            totalUsers: whitelist.length,
            users: whitelist.map((email, idx) => ({
                name: email.split('@')[0],
                email: email,
                lastLogin: new Date().toISOString(),
                photo: null
            }))
        };
    }
};
export const getAdminList = async () => state.adminEmails;
export const addAdminEmail = async (email: string) => {
    if (!state.adminEmails.includes(email)) {
        const newList = [...state.adminEmails, email];
        state.adminEmails = newList;
        saveToLocal();
        // Sync to app_settings
        if (isCloudUser()) {
            await supabase.from('app_settings').upsert({ key: 'admin_emails', value: newList });
        }
    }
};
export const removeAdminEmail = async (email: string) => {
    const newList = state.adminEmails.filter(e => e !== email);
    state.adminEmails = newList;
    saveToLocal();
    if (isCloudUser()) {
        await supabase.from('app_settings').upsert({ key: 'admin_emails', value: newList });
    }
};
export const getWalletWhitelist = async () => state.walletWhitelist;
export const addToWalletWhitelist = async (email: string) => {
    if (!state.walletWhitelist.includes(email)) {
        state.walletWhitelist.push(email);
        saveToLocal();
        // Also sync to table 'wallet_whitelist'
        if(isCloudUser()) {
            try {
                const { error } = await supabase.from('wallet_whitelist').insert({ email });
                if(error) throw error;
            } catch(e) {
                console.error("Whitelist insert failed", e);
            }
        }
    }
};
export const removeFromWalletWhitelist = async (email: string) => {
    state.walletWhitelist = state.walletWhitelist.filter(e => e !== email);
    saveToLocal();
    if(isCloudUser()) {
        try {
            await supabase.from('wallet_whitelist').delete().eq('email', email);
        } catch(e) {
            console.error("Whitelist delete failed", e);
        }
    }
};
export const getAPIClients = () => state.apiClients;
export const createAPIClient = async (name: string) => {
    const key = `sk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newClient: APIClient = {
        id: `client_${Date.now()}`,
        name,
        apiKey: key,
        isActive: true,
        createdAt: new Date().toISOString(),
        requestsCount: 0
    };
    state.apiClients.push(newClient);
    saveToLocal();
    // Sync to DB
    if(isCloudUser()) {
        const payload = { 
            id: newClient.id, 
            name, 
            api_key: key, 
            is_active: true 
        };
        // Disable attaching user_id for global table
        await upsertTable('api_clients', payload, false);
    }
    return key;
};
export const toggleAPIClientStatus = async (id: string, currentStatus: boolean) => {
    const c = state.apiClients.find(c => c.id === id);
    if (c) {
        c.isActive = !currentStatus;
        saveToLocal();
        if(isCloudUser()) await supabase.from('api_clients').update({ is_active: !currentStatus }).eq('id', id);
    }
};
export const deleteAPIClient = async (id: string) => {
    state.apiClients = state.apiClients.filter(c => c.id !== id);
    saveToLocal();
    if(isCloudUser()) await supabase.from('api_clients').delete().eq('id', id);
};
