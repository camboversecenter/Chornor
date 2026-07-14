
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CryptoAsset, CryptoTransaction, Currency, UserProfile } from '../types';
import * as storage from '../services/storageService';
import { searchCoins, getCoinPrices } from '../services/coingeckoService';
import { extractWalletAddress } from '../services/geminiService';
import { showConfirm, showAlert } from '../services/alertService';
import { CURRENCY_USD, CURRENCY_KHR, EXCHANGE_RATE } from '../constants';
import { Plus, ArrowLeft, TrendingUp, Bitcoin, Trash2, List, BarChart2, Check, Wallet, LogOut, Loader2, WifiOff, AlertTriangle, Info, RefreshCw, Search, X, Briefcase, CreditCard, Send, QrCode, ArrowDown, ArrowUp, ExternalLink, Camera, Lock, Layers, Settings, CheckCircle2, ChevronRight, ShieldCheck, Maximize2 } from 'lucide-react';
import CryptoAnalytics from './CryptoAnalytics';
import { createThirdwebClient, defineChain, prepareTransaction, toWei } from "thirdweb";
import { useConnect, useActiveAccount, useActiveWalletChain, useDisconnect, useActiveWallet, useWalletBalance, useSendTransaction } from "thirdweb/react";
import { inAppWallet, getWalletBalance } from "thirdweb/wallets";
import { supabase } from '../services/supabaseClient';
import { useWalletSigner } from '../../wallet';
import { createStorageAdapter } from '../../wallet/storage';

// Thirdweb Client Setup
const client = createThirdwebClient({
  clientId: "031d1b8674c92302136defb9fd7a044e",
});

// Define Base chain (ID: 8453)
const chain = defineChain(8453);

// Supported Base Tokens to scan for
// We use these addresses to fetch metadata (Name/Symbol) via SDK instead of hardcoding
const SUPPORTED_BASE_TOKENS = [
  { address: 'NATIVE', coingeckoId: 'ethereum' }, // ETH
  { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', coingeckoId: 'usd-coin' }, // USDC
  { address: '0x4200000000000000000000000000000000000006', coingeckoId: 'weth' }, // WETH
  { address: '0x50c5725949a6F0c72E6C4a641F24049A917DB0Cb', coingeckoId: 'dai' }, // DAI
  { address: '0x532f27101965dd16442E59d40670FaF5eBB142E4', coingeckoId: 'brett-based' }, // BRETT
  { address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', coingeckoId: 'degen-base' }, // DEGEN
  { address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', coingeckoId: 'aerodrome-finance' }, // AERO
  { address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', coingeckoId: 'coinbase-wrapped-staked-eth' }, // cbETH
];

const POPULAR_TOKENS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', logo: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', logo: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png' },
  { id: 'tether', symbol: 'USDT', name: 'Tether', logo: 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', logo: 'https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', logo: 'https://assets.coingecko.com/coins/images/4128/thumb/solana.png' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USDC', logo: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', logo: 'https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white-128.png' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', logo: 'https://assets.coingecko.com/coins/images/975/thumb/cardano.png' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', logo: 'https://assets.coingecko.com/coins/images/12559/thumb/Avalanche_Circle_RedWhite_Trans.png' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', logo: 'https://assets.coingecko.com/coins/images/5/thumb/dogecoin.png' },
];

interface CryptoManagerProps {
    preferredCurrency?: Currency;
    currentUser?: UserProfile | null;
}

interface WalletToken {
    address: string;
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
    coingeckoId?: string;
}

const CryptoManager: React.FC<CryptoManagerProps> = ({ preferredCurrency = 'KHR', currentUser }) => {
  // Main Tab State
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'WALLET'>('PORTFOLIO');

  // Portfolio State
  const [view, setView] = useState<'LIST' | 'FORM' | 'DETAIL' | 'ANALYTICS'>('LIST');
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);
  const [transactions, setTransactions] = useState<CryptoTransaction[]>([]);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Wallet State
  const [walletView, setWalletView] = useState<'MAIN' | 'SEND' | 'RECEIVE'>('MAIN');
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [vaultExists, setVaultExists] = useState<boolean | null>(null);
  const [walletPin, setWalletPin] = useState('');
  
  // Wallet Asset Management
  const [walletTokens, setWalletTokens] = useState<WalletToken[]>([]);
  const [walletPrices, setWalletPrices] = useState<Record<string, number>>({});
  const [isManageAssetsOpen, setIsManageAssetsOpen] = useState(false);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);

  // Manual Transaction Form
  const [actionType, setActionType] = useState<'BUY' | 'SELL'>('BUY');
  const [actionPrice, setActionPrice] = useState('');
  const [actionQty, setActionQty] = useState('');
  const [manualPrice, setManualPrice] = useState('');

  // Thirdweb Hooks
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { connect, isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  // Native balance hook for main display fallback
  const { data: nativeBalance, isLoading: isBalanceLoading } = useWalletBalance({ client, chain, address: account?.address });
  const { mutate: sendTx, isPending: isSendingTx, error: sendError, isSuccess: isSendSuccess } = useSendTransaction();
  const vaultStorage = useMemo(() => createStorageAdapter(), []);
  const secureWallet = useWalletSigner({
      storage: vaultStorage,
      onError: (error) => setActivationError(error.message)
  });

  useEffect(() => {
      let cancelled = false;
      if (!currentUser || currentUser.isTestUser) {
          setVaultExists(false);
          return;
      }
      setVaultExists(null);
      vaultStorage.load(currentUser.id)
          .then(record => {
              if (!cancelled) setVaultExists(Boolean(record));
          })
          .catch(error => {
              if (!cancelled) setActivationError(error instanceof Error ? error.message : String(error));
          });
      return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.isTestUser, vaultStorage]);

  useEffect(() => {
    refreshList();
  }, []);

  useEffect(() => {
    return storage.subscribeToDataChanges(() => {
      setAssets(storage.getCryptoAssets());
      setSelectedAsset(prev => {
        if (!prev) return prev;
        const updated = storage.getCryptoAssets().find(a => a._id === prev._id) || null;
        if (updated) {
          setTransactions(storage.getCryptoTransactions(updated._id));
          setManualPrice(updated.currentPrice.toString());
        }
        return updated;
      });
    });
  }, []);

  // Effect to fetch Wallet Token Balances & Prices
  useEffect(() => {
      if (activeTab === 'WALLET' && account?.address) {
          fetchWalletData();
      }
  }, [activeTab, account]);

  // Wallet Persistence: Auto-Connect if previously active
  useEffect(() => {
      const checkAutoConnect = async () => {
          const shouldBeActive = localStorage.getItem('chornor_wallet_active') === 'true';
          // Only attempt if not already connected and not currently activating
          if (shouldBeActive && !account && !isActivating && !currentUser?.isTestUser) {
              console.log("Attempting to restore wallet session...");
              await handleActivateWallet(true); // Silent mode implied by useEffect context
          }
      };
      
      checkAutoConnect();
  }, [activeTab]); // Check when switching tabs or loading

  const fetchWalletData = async () => {
      if (!account) return;
      setIsFetchingBalances(true);

      const tokens: WalletToken[] = [];
      const cgIds: string[] = [];
      
      try {
          // Parallel fetch balances and metadata
          await Promise.all(SUPPORTED_BASE_TOKENS.map(async (t) => {
              try {
                  const result = await getWalletBalance({
                      client,
                      chain,
                      address: account.address,
                      tokenAddress: t.address === 'NATIVE' ? undefined : t.address,
                  });
                  
                  tokens.push({
                      address: t.address,
                      symbol: result.symbol,
                      name: result.name,
                      balance: result.displayValue,
                      decimals: result.decimals,
                      coingeckoId: t.coingeckoId
                  });
                  if (t.coingeckoId) cgIds.push(t.coingeckoId);
              } catch (e) {
                  console.warn(`Failed to fetch balance for ${t.address}`, e);
              }
          }));

          // Sort by balance (desc) then symbol
          tokens.sort((a, b) => {
             const balA = parseFloat(a.balance);
             const balB = parseFloat(b.balance);
             return balB - balA || a.symbol.localeCompare(b.symbol);
          });

          setWalletTokens(tokens);

          // Fetch Prices
          if (cgIds.length > 0) {
              const prices = await getCoinPrices(cgIds);
              const priceMap: Record<string, number> = {};
              Object.keys(prices).forEach(id => {
                  priceMap[id] = prices[id].usd;
              });
              setWalletPrices(priceMap);
          }

      } catch (e) {
          console.error("Error fetching wallet data", e);
      }
      setIsFetchingBalances(false);
  };

  const refreshList = () => {
    setAssets(storage.getCryptoAssets());
    if (selectedAsset) {
        const updated = storage.getCryptoAssets().find(a => a._id === selectedAsset._id);
        if (updated) {
            setSelectedAsset(updated);
            setTransactions(storage.getCryptoTransactions(updated._id));
            setManualPrice(updated.currentPrice.toString());
        }
    }
  };

  const handleRefreshPrices = async () => {
      setIsUpdatingPrices(true);
      const ids = assets.map(a => a.coingeckoId).filter(id => !!id) as string[];
      if (ids.length > 0) {
          try {
              const prices = await getCoinPrices(ids);
              const priceMap: Record<string, number> = {};
              Object.keys(prices).forEach(key => {
                  priceMap[key] = prices[key].usd;
              });
              storage.updateCryptoAssetPrices(priceMap);
              refreshList();
          } catch (e) {
              console.error("Failed to update prices", e);
          }
      }
      setIsUpdatingPrices(false);
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      if (query.length >= 2) {
          setIsSearching(true);
          try {
              const results = await searchCoins(query);
              setSearchResults(results || []);
          } catch(e) {
              console.error(e);
          }
          setIsSearching(false);
      } else {
          setSearchResults([]);
      }
  };

  const handleSelectCoin = async (coin: any) => {
      const existing = assets.find(a => a.coingeckoId === coin.id);
      if (existing) {
          showAlert("ស្ទួន (Duplicate)", `${coin.symbol} មាននៅក្នុងបញ្ជីរួចហើយ។`, "warning");
          return;
      }

      let currentPrice = 0;
      try {
          const priceData = await getCoinPrices([coin.id]);
          if (priceData[coin.id]) {
              currentPrice = priceData[coin.id].usd;
          }
      } catch (e) {
          console.error("Could not fetch initial price", e);
      }

      const newAsset: CryptoAsset = {
        _id: Date.now().toString(),
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        coingeckoId: coin.id, 
        image: coin.large || coin.thumb,
        quantity: 0,
        averageBuyPrice: 0,
        currentPrice: currentPrice,
        createdAt: new Date().toISOString()
      };

      storage.saveCryptoAsset(newAsset);
      refreshList();
      setSelectedAsset(newAsset);
      setTransactions([]);
      setView('DETAIL');
      setSearchQuery('');
      setSearchResults([]);
  };

  const handleTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedAsset || !actionPrice || !actionQty) return;

      const tx: CryptoTransaction = {
          _id: Date.now().toString(),
          assetId: selectedAsset._id,
          type: actionType,
          price: parseFloat(actionPrice),
          quantity: parseFloat(actionQty),
          date: new Date().toISOString()
      };

      storage.addCryptoTransaction(tx);
      setActionPrice('');
      setActionQty('');
      refreshList();
  };

  const handleDeleteAsset = async (id: string) => {
      const confirmed = await showConfirm("លុបទ្រព្យ? (Delete Asset?)", "លុបទ្រព្យនេះនិងប្រវត្តិទាំងអស់? (Delete this asset and history?)");
      if(confirmed) {
          const result = await storage.deleteCryptoAsset(id);
          if (result.success) {
              refreshList();
              setSelectedAsset(null);
              setView('LIST');
          } else {
              showAlert("កំហុស (Error)", "មិនអាចលុបទ្រព្យបានទេ។ (Unable to delete asset)", "error");
          }
      }
  };

  const handleDeleteTx = async (id: string) => {
      const confirmed = await showConfirm("លុប? (Delete?)", "លុបប្រតិបត្តិការនេះ? (Delete this transaction?)");
      if(confirmed) {
          storage.deleteCryptoTransaction(id);
          refreshList();
      }
  };

  // --- WALLET ACTIVATION LOGIC ---

  const handleActivateWallet = async (silentMode: boolean = false) => {
      if (currentUser?.isTestUser) {
          if (!silentMode) setActivationError("Wallet activation requires a signed-in Google account.");
          return;
      }
      
      setIsActivating(true);
      setActivationError(null);

      if (!currentUser || vaultExists === null) {
          if (!silentMode) setActivationError("Secure wallet data is still loading. Please try again.");
          setIsActivating(false);
          return;
      }

      // The vault module encrypts wallet secret material in its worker before
      // atomically persisting it to wallet_vaults for this Supabase user.
      if (!secureWallet.isUnlocked) {
          if (!/^\d{6}$/.test(walletPin)) {
              if (!silentMode) setActivationError("Enter a 6-digit wallet PIN.");
              setIsActivating(false);
              return;
          }

          if (vaultExists) {
              const unlocked = await secureWallet.unlockWithPin(currentUser.id, walletPin);
              if (!unlocked) {
                  if (!silentMode) setActivationError("Could not unlock the wallet. Check your PIN.");
                  setIsActivating(false);
                  return;
              }
          } else {
              const created = await secureWallet.createWallet(currentUser.id, walletPin, {
                  email: currentUser.email,
                  wordCount: 12
              });
              if (!created) {
                  setIsActivating(false);
                  return;
              }
              setVaultExists(true);
              if (created.mnemonic) {
                  await showAlert(
                      "Save your recovery phrase",
                      `Write this down now and keep it private:\n\n${created.mnemonic}`,
                      "warning"
                  );
              }
          }
      }
      
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;

      if (!accessToken) {
          if (!silentMode) setActivationError("Session expired. Please logout and login again.");
          setIsActivating(false);
          return;
      }

      let targetToken = accessToken;
      
      try {
          const { data: funcData, error: funcError } = await supabase.functions.invoke('thirdweb-token', {
              headers: { Authorization: `Bearer ${accessToken}` }
          });

          if (funcError) {
              console.error("Token Exchange Error:", funcError);
              let msg = typeof funcError === 'string' ? funcError : (funcError.message || JSON.stringify(funcError));
              const response = (funcError as any)?.context;
              if (response && typeof response.json === 'function') {
                  try {
                      const body = await response.json();
                      msg = body?.error || body?.message || msg;
                  } catch {
                      // Keep the SDK error message if the response is not JSON.
                  }
              }
              if (msg.includes("Access Denied") || msg.includes("whitelisted")) {
                  setActivationError("ACCESS_DENIED"); 
              } else {
                  setActivationError("System Error: " + msg);
              }
              setIsActivating(false);
              return;
          } 
          
          if (funcData?.token) {
              targetToken = funcData.token;
              
              await connect(async () => {
                  const walletInstance = inAppWallet();
                  await walletInstance.connect({
                      client,
                      chain,
                      strategy: "jwt",
                      jwt: targetToken,
                  });
                  return walletInstance;
              });
              
              localStorage.setItem('chornor_wallet_active', 'true');
          }
      } catch (e: any) {
          console.warn("Edge function exception:", e);
          if (!silentMode) setActivationError(e.message);
      }
      setIsActivating(false);
  };

  const handleDisconnect = () => {
      if (wallet) {
          disconnect(wallet);
      }
      localStorage.removeItem('chornor_wallet_active');
      setWalletPin('');
      void secureWallet.lock();
  };

  const handleSendTransaction = () => {
      if (!sendAddress || !sendAmount) return;
      try {
          const transaction = prepareTransaction({
            to: sendAddress,
            chain: chain,
            client: client,
            value: toWei(sendAmount),
          });
          sendTx(transaction);
      } catch (e: any) {
          showAlert("មិនត្រឹមត្រូវ (Invalid)", "ប្រតិបត្តិការមិនត្រឹមត្រូវ៖ (Invalid transaction) " + e.message, "error");
      }
  };

  useEffect(() => {
      if (isSendSuccess) {
          showAlert("ជោគជ័យ (Success)", "បានផ្ញើដោយជោគជ័យ! (Transaction Sent Successfully!)", "success");
          setSendAddress('');
          setSendAmount('');
          setWalletView('MAIN');
      }
  }, [isSendSuccess]);

  const handleScanQR = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsScanning(true);
      const address = await extractWalletAddress(file);
      setIsScanning(false);

      if (address) {
          setSendAddress(address);
      } else {
          showAlert("កំហុសក្នុងការស្កេន (Scan Error)", "មិនអាចស្វែងរកអាសយដ្ឋានកាបូបបានទេ។ (Could not detect wallet address)", "error");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- RENDER HELPERS ---
  const formatMoney = (amountUSD: number) => {
      if (preferredCurrency === 'KHR') {
          return `${new Intl.NumberFormat('km-KH').format(amountUSD * EXCHANGE_RATE)}${CURRENCY_KHR}`;
      }
      return `${CURRENCY_USD}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(amountUSD)}`;
  };

  // Portfolio PnL
  const totalPortfolioValue = assets.reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0);
  const totalCostBasis = assets.reduce((acc, a) => acc + (a.quantity * a.averageBuyPrice), 0);
  const totalPnL = totalPortfolioValue - totalCostBasis;

  // Wallet Total Value (Sum of all owned tokens)
  const walletTotalValueUSD = walletTokens.reduce((acc, token) => {
      const bal = parseFloat(token.balance);
      const price = (token.coingeckoId && walletPrices[token.coingeckoId]) || 0;
      return acc + (bal * price);
  }, 0);

  // Filter for Display: Owned Tokens (>0)
  const ownedTokens = walletTokens.filter(t => parseFloat(t.balance) > 0);
  
  return (
    <div className="pb-24 md:pb-6 h-full flex flex-col">
        
        {/* Top Navigation Switch */}
        <div className="flex bg-gray-200 p-1 rounded-xl mb-6 mx-auto max-w-md w-full">
            <button 
                onClick={() => setActiveTab('PORTFOLIO')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'PORTFOLIO' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
                <Briefcase size={16} />
                វិនិយោគ (Portfolio)
            </button>
            <button 
                onClick={() => setActiveTab('WALLET')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'WALLET' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
                <CreditCard size={16} />
                កាបូប (Wallet)
            </button>
        </div>

        {/* --- PORTFOLIO SECTION --- */}
        {activeTab === 'PORTFOLIO' && (
            <div className="flex-1 md:grid md:grid-cols-12 md:gap-6 animate-in fade-in h-full">
                
                {/* LEFT COLUMN: ASSET LIST */}
                <div className={`md:col-span-4 lg:col-span-4 md:block flex flex-col h-full ${view !== 'LIST' ? 'hidden' : 'block'}`}>
                    
                    {/* Summary Card */}
                    <div className="flex items-center justify-between mb-4 bg-white text-gray-900 p-4 rounded-xl shadow-sm border border-gray-100">
                        <div>
                            <p className="text-xs text-gray-500">តម្លៃសរុប (Total Value)</p>
                            <p className="font-bold text-2xl text-gray-900">{formatMoney(totalPortfolioValue)}</p>
                        </div>
                        <div className={`text-right ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <p className="text-xs text-gray-500">ចំណេញ/ខាត (All Time P/L)</p>
                            <p className="font-bold text-lg">{totalPnL >= 0 ? '+' : ''}{formatMoney(totalPnL)}</p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h2 className="text-xl font-bold text-gray-800">ទ្រព្យ (Assets)</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setView('ANALYTICS')} className="p-2 bg-white shadow-sm rounded-lg text-gray-500 hover:text-indigo-600 md:hidden">
                                <BarChart2 size={20} />
                            </button>
                            <button 
                                onClick={handleRefreshPrices} 
                                disabled={isUpdatingPrices}
                                className={`p-2 rounded-lg bg-white shadow-sm text-gray-500 hover:text-indigo-600 transition-all ${isUpdatingPrices ? 'opacity-50' : ''}`}
                            >
                                <RefreshCw size={20} className={isUpdatingPrices ? 'animate-spin' : ''} />
                            </button>
                            <button 
                                onClick={() => setView('FORM')} 
                                className="bg-indigo-600 text-white p-2 rounded-lg shadow-md hover:bg-indigo-700 transition-all"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Asset List Items */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-20 md:pb-0">
                        {assets.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                                <Bitcoin size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No assets yet.</p>
                            </div>
                        ) : (
                            assets.map(asset => (
                                <div 
                                    key={asset._id} 
                                    onClick={() => { setSelectedAsset(asset); setTransactions(storage.getCryptoTransactions(asset._id)); setView('DETAIL'); }} 
                                    className={`p-4 rounded-xl shadow-sm border flex justify-between items-center cursor-pointer transition-all hover:shadow-md ${selectedAsset?._id === asset._id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:border-indigo-100'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {asset.image ? <img src={asset.image} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center font-bold text-indigo-600">{asset.symbol[0]}</div>}
                                        <div><h3 className="font-bold text-gray-800">{asset.name}</h3><p className="text-xs text-gray-500">{asset.quantity} {asset.symbol}</p></div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800">{formatMoney(asset.quantity * asset.currentPrice)}</p>
                                        <p className="text-xs text-gray-400">@ ${asset.currentPrice.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: DYNAMIC CONTENT */}
                <div className={`md:col-span-8 lg:col-span-8 h-full overflow-y-auto md:block ${view === 'LIST' ? 'hidden md:block' : 'block'}`}>
                    {/* ... (Existing Portfolio Detail/Form logic retained, no changes here to save space) ... */}
                    {(view === 'ANALYTICS' || (view === 'LIST' && !selectedAsset && assets.length > 0)) && (
                        <div className="animate-in fade-in h-full">
                             <div className="md:hidden flex items-center mb-4">
                                <button onClick={() => setView('LIST')} className="p-2 hover:bg-gray-100 rounded-full mr-2"><ArrowLeft size={20} /></button>
                                <h2 className="text-xl font-bold">Analytics</h2>
                            </div>
                            <CryptoAnalytics assets={assets} preferredCurrency={preferredCurrency} />
                        </div>
                    )}
                    
                    {view === 'FORM' && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl mx-auto animate-in slide-in-from-bottom-5">
                            <div className="flex items-center mb-4">
                                <button onClick={() => setView('LIST')} className="p-2 hover:bg-gray-100 rounded-full mr-2 md:hidden"><ArrowLeft size={20} /></button>
                                <h2 className="text-xl font-bold text-gray-800">Add New Asset</h2>
                            </div>
                            
                            <div className="relative mb-6">
                                <input 
                                    type="text" 
                                    placeholder="Search CoinGecko (e.g. Bitcoin)..." 
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    autoFocus
                                />
                                <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                                {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-3 top-3.5 text-gray-400"><X size={18} /></button>}
                            </div>
                            {isSearching && <div className="text-center py-4 text-gray-500"><Loader2 size={18} className="animate-spin inline mr-2"/> Searching...</div>}
                            
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {searchResults.length > 0 ? (
                                    searchResults.map((coin: any) => {
                                        const isAdded = assets.some(a => a.coingeckoId === coin.id);
                                        return (
                                            <div key={coin.id} onClick={() => !isAdded && handleSelectCoin(coin)} className={`flex items-center justify-between p-3 border rounded-xl ${isAdded ? 'bg-gray-50 opacity-60' : 'hover:border-indigo-300 cursor-pointer'}`}>
                                                <div className="flex items-center gap-3">
                                                    <img src={coin.thumb} className="w-8 h-8 rounded-full" />
                                                    <div><p className="font-bold">{coin.name}</p><p className="text-xs text-gray-500">{coin.symbol}</p></div>
                                                </div>
                                                {isAdded ? <Check size={16} className="text-green-500" /> : <Plus size={16} className="text-gray-400" />}
                                            </div>
                                        );
                                    })
                                ) : !searchQuery && (
                                    <>
                                        <p className="text-xs text-gray-500 font-bold mb-2">POPULAR TOKENS</p>
                                        {POPULAR_TOKENS.map(token => (
                                            <div key={token.symbol} onClick={() => !assets.some(a => a.symbol === token.symbol) && handleSelectCoin({id: token.id, symbol: token.symbol, name: token.name, thumb: token.logo})} className="flex items-center gap-3 p-3 border rounded-xl hover:border-indigo-300 cursor-pointer mb-2">
                                                <img src={token.logo} className="w-8 h-8 rounded-full" />
                                                <div><p className="font-bold">{token.name}</p><p className="text-xs text-gray-500">{token.symbol}</p></div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {view === 'DETAIL' && selectedAsset && (
                        <div className="animate-in fade-in h-full flex flex-col">
                            {/* Desktop Header for Detail */}
                            <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl md:rounded-2xl md:mb-6 md:shadow-sm sticky top-0 z-10">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setView('LIST')} className="p-2 hover:bg-gray-100 rounded-full md:hidden"><ArrowLeft size={20} /></button>
                                    <div className="flex items-center gap-3">
                                        {selectedAsset.image && <img src={selectedAsset.image} className="w-10 h-10 rounded-full" />}
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800 leading-none">{selectedAsset.name}</h2>
                                            <p className="text-xs text-gray-500">{selectedAsset.symbol}</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteAsset(selectedAsset._id)} className="text-red-400 p-2 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={20} /></button>
                            </div>
                            
                            <div className="grid lg:grid-cols-2 gap-6 flex-1 overflow-y-auto p-1">
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                                        <div className="flex justify-between mb-4">
                                            <span className="text-indigo-600/70 text-sm font-medium">ចំនួនកាន់កាប់ (Holdings)</span>
                                            <span className="font-bold text-xl text-indigo-900">{selectedAsset.quantity} {selectedAsset.symbol}</span>
                                        </div>
                                        <div className="flex justify-between mb-4">
                                            <span className="text-indigo-600/70 text-sm font-medium">តម្លៃបច្ចុប្បន្ន (Current Value)</span>
                                            <span className="font-bold text-3xl text-indigo-700">{formatMoney(selectedAsset.quantity * selectedAsset.currentPrice)}</span>
                                        </div>
                                        <div className="h-px bg-indigo-200/50 my-4"></div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-indigo-600/70 text-xs">តម្លៃទិញមធ្យម (Avg Buy Price)</span>
                                            <span className="font-mono text-sm bg-white/80 px-2 py-1 rounded text-indigo-800 border border-indigo-100">${selectedAsset.averageBuyPrice.toFixed(4)}</span>
                                        </div>
                                    </div>

                                    <form onSubmit={handleTransaction} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">បន្ថែមប្រតិបត្តិការ (Add Transaction)</h3>
                                        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                                            <button type="button" onClick={() => setActionType('BUY')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${actionType === 'BUY' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>ទិញ (BUY)</button>
                                            <button type="button" onClick={() => setActionType('SELL')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${actionType === 'SELL' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>លក់ (SELL)</button>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs text-gray-400 font-bold ml-1 mb-1 block">ចំនួន (QUANTITY)</label>
                                                <input type="number" step="any" placeholder="0.00" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={actionQty} onChange={e => setActionQty(e.target.value)} required />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400 font-bold ml-1 mb-1 block">តម្លៃក្នុងមួយឯកតា (PRICE PER UNIT $)</label>
                                                <input type="number" step="any" placeholder="0.00" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={actionPrice} onChange={e => setActionPrice(e.target.value)} required />
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold mt-6 hover:bg-slate-800 transition-transform active:scale-[0.98] shadow-lg shadow-slate-200">
                                            {actionType === 'BUY' ? 'Record Buy' : 'Record Sell'}
                                        </button>
                                    </form>
                                </div>
                                <div>
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
                                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                            <h3 className="font-bold text-gray-800 text-sm">ប្រវត្តិ (History)</h3>
                                        </div>
                                        <div className="divide-y divide-gray-100 overflow-y-auto max-h-[500px]">
                                            {transactions.length === 0 ? (
                                                <div className="p-8 text-center text-gray-400 text-sm">មិនទាន់មានប្រតិបត្តិការ។ (No transactions)</div>
                                            ) : (
                                                transactions.map(tx => (
                                                    <div key={tx._id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors group">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${tx.type === 'BUY' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                                {tx.type[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800 text-sm">{tx.type} {selectedAsset.symbol}</p>
                                                                <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-sm">{tx.quantity} <span className="text-xs text-gray-400">{selectedAsset.symbol}</span></p>
                                                            <p className="text-xs text-gray-500">@ ${tx.price.toLocaleString()}</p>
                                                        </div>
                                                        <button onClick={() => handleDeleteTx(tx._id)} className="p-2 text-gray-300 hover:text-red-500 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {view === 'LIST' && !selectedAsset && assets.length === 0 && (
                        <div className="hidden md:flex h-full items-center justify-center text-gray-400 flex-col gap-3">
                            <Bitcoin size={48} className="opacity-20" />
                            <p>Select an asset or add a new one.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- WALLET SECTION --- */}
        {activeTab === 'WALLET' && (
            <div className="animate-in slide-in-from-right-5 h-full">
                {!account ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md mx-auto mt-10 border border-gray-100">
                        <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                            <Wallet size={32} className="text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">បើកដំណើរការកាបូប (Activate Wallet)</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            បង្កើតកាបូបឌីជីថល (Web3 Wallet) សម្រាប់គណនីរបស់អ្នក។
                            <br/><span className="text-xs text-orange-500">តម្រូវឱ្យមានការអនុញ្ញាតពី Admin (Whitelist Required)</span>
                        </p>

                        {!currentUser?.isTestUser && (
                            <div className="mb-4 text-left">
                                <label className="mb-1 block text-xs font-bold text-gray-600">
                                    {vaultExists ? 'Wallet PIN' : 'Create a 6-digit Wallet PIN'}
                                </label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={6}
                                    value={walletPin}
                                    onChange={event => setWalletPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="••••••"
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                                <p className="mt-1 text-xs text-gray-400">
                                    {vaultExists === null ? 'Checking secure wallet backup…' : vaultExists ? 'Unlocks your encrypted wallet_vaults backup.' : 'Your wallet will be encrypted before it is saved.'}
                                </p>
                            </div>
                        )}
                        
                        {activationError === "ACCESS_DENIED" ? (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6 text-left animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 mb-2 text-red-700 font-bold">
                                    <Lock size={20} />
                                    Access Restricted
                                </div>
                                <p className="text-sm text-red-600 mb-2">
                                    Your account is not whitelisted to use the Wallet feature.
                                </p>
                                <div className="text-xs text-red-500 bg-white/50 p-2 rounded">
                                    User Email: <b>{currentUser?.email}</b>
                                </div>
                                <p className="text-xs text-red-400 mt-2">Please contact an administrator to activate.</p>
                            </div>
                        ) : activationError ? (
                            <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-4 text-left flex gap-2 items-start">
                                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-red-600 font-bold mb-1">Activation Failed:</p>
                                    <p className="text-xs text-red-500">{activationError}</p>
                                </div>
                            </div>
                        ) : null}

                        <button 
                            onClick={() => handleActivateWallet(false)}
                            disabled={isActivating || vaultExists === null || activationError === "ACCESS_DENIED"}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {isActivating ? <Loader2 className="animate-spin" /> : <ShieldCheck size={18} />}
                            {activationError === "ACCESS_DENIED" ? "Not Eligible" : "Activate Now"}
                        </button>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto h-full flex flex-col md:grid md:grid-cols-12 md:gap-6">
                        
                        {/* Left Column: Card + Nav + Assets */}
                        <div className={`md:col-span-5 flex flex-col gap-6 overflow-y-auto scrollbar-hide pb-20 md:pb-0 ${walletView !== 'MAIN' ? 'hidden md:flex' : 'flex'}`}>
                            {/* Main Wallet Card */}
                            <div className="bg-white rounded-3xl p-6 text-gray-900 shadow-sm border border-gray-100 relative overflow-hidden transform transition-transform hover:scale-[1.01]">
                                <div className="absolute top-0 right-0 p-4 text-gray-100"><Wallet size={100} /></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start">
                                        <span className="text-gray-600 text-xs font-mono bg-gray-100 px-2 py-1 rounded">{account.address.slice(0,6)}...{account.address.slice(-4)}</span>
                                        <button onClick={handleDisconnect} className="text-gray-400 hover:text-red-500"><LogOut size={18} /></button>
                                    </div>
                                    <div className="mt-6">
                                        <p className="text-gray-500 text-sm">តម្លៃសរុប (Total Holding)</p>
                                        <h2 className="text-4xl font-bold text-gray-900 mt-1">
                                            {isFetchingBalances 
                                                ? '...' 
                                                : formatMoney(walletTotalValueUSD)
                                            }
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Native: {Number(nativeBalance?.displayValue).toFixed(4)} {nativeBalance?.symbol}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Actions Row */}
                            <div className="flex md:hidden justify-between gap-4">
                                <button onClick={() => setWalletView('SEND')} className="flex-1 flex flex-col items-center gap-2 bg-white p-4 rounded-2xl shadow-sm hover:bg-gray-50 transition-all border border-gray-100">
                                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full"><ArrowUp size={24} /></div>
                                    <span className="font-bold text-gray-700">ផ្ញើ (Send)</span>
                                </button>
                                <button onClick={() => setWalletView('RECEIVE')} className="flex-1 flex flex-col items-center gap-2 bg-white p-4 rounded-2xl shadow-sm hover:bg-gray-50 transition-all border border-gray-100">
                                    <div className="p-3 bg-green-100 text-green-600 rounded-full"><ArrowDown size={24} /></div>
                                    <span className="font-bold text-gray-700">ទទួល (Receive)</span>
                                </button>
                            </div>

                            {/* ASSETS LIST */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-1">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                        <Layers size={16} className="text-indigo-600" />
                                        ទ្រព្យ (Assets)
                                    </h3>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={fetchWalletData} 
                                            className="p-1.5 bg-gray-50 rounded-lg hover:bg-gray-100"
                                            disabled={isFetchingBalances}
                                        >
                                            <RefreshCw size={14} className={`text-gray-500 ${isFetchingBalances ? 'animate-spin' : ''}`} />
                                        </button>
                                        <button 
                                            onClick={() => setIsManageAssetsOpen(true)}
                                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                                        >
                                            <Settings size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {ownedTokens.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400 text-xs">
                                            No assets with balance found.
                                        </div>
                                    ) : (
                                        ownedTokens.map(token => {
                                            const price = (token.coingeckoId && walletPrices[token.coingeckoId]) || 0;
                                            const valUSD = parseFloat(token.balance) * price;

                                            return (
                                                <div key={token.symbol} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${token.symbol === 'ETH' ? 'bg-blue-600' : 'bg-slate-700'}`}>
                                                            {token.symbol[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 text-sm">{token.name}</p>
                                                            <p className="text-xs text-gray-500">{Number(token.balance).toFixed(4)} {token.symbol}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-800 text-sm">
                                                            {formatMoney(valUSD)}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {price > 0 && `@ ${price.toFixed(2)}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Dynamic Content (Send/Receive) */}
                        <div className={`md:col-span-7 h-full ${walletView === 'MAIN' ? 'hidden md:block' : 'block'}`}>
                            
                            {/* Desktop "Main" View */}
                            {walletView === 'MAIN' && (
                                <div className="hidden md:flex flex-col h-full gap-6">
                                    {/* Action Buttons Desktop */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setWalletView('SEND')}
                                            className="p-6 rounded-2xl text-left font-bold border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all flex flex-col gap-3 group"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <ArrowUp className="text-indigo-600" />
                                            </div>
                                            <span className="text-lg text-gray-800">ផ្ញើកាក់ (Send)</span>
                                        </button>
                                        <button 
                                            onClick={() => setWalletView('RECEIVE')}
                                            className="p-6 rounded-2xl text-left font-bold border border-gray-100 bg-white hover:border-green-200 hover:shadow-md transition-all flex flex-col gap-3 group"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <ArrowDown className="text-green-600" />
                                            </div>
                                            <span className="text-lg text-gray-800">ទទួលកាក់ (Receive)</span>
                                        </button>
                                    </div>

                                    {/* Recent Activity Placeholder */}
                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 flex-1">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-bold text-gray-800 text-lg">សកម្មភាពថ្មីៗ (Recent Activity)</h3>
                                        </div>
                                        <div className="text-center py-12 text-gray-400 text-sm flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-100 rounded-2xl">
                                            <p className="mb-3">Transaction history requires blockchain indexing.</p>
                                            <a 
                                                href={`https://basescan.org/address/${account.address}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 hover:underline text-sm font-bold bg-indigo-50 px-4 py-2 rounded-full transition-colors"
                                            >
                                                View on BaseScan <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {walletView === 'SEND' && (
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 animate-in slide-in-from-right h-full">
                                    <div className="flex items-center gap-2 mb-6 md:mb-8">
                                        <button onClick={() => setWalletView('MAIN')} className="p-2 hover:bg-gray-100 rounded-full md:hover:bg-indigo-50"><ArrowLeft size={24} /></button>
                                        <h3 className="font-bold text-xl md:text-2xl text-gray-800">ផ្ញើកាក់ (Send)</h3>
                                    </div>

                                    <div className="space-y-6 max-w-lg mx-auto md:mx-0">
                                        <div>
                                            <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wide">អាសយដ្ឋានអ្នកទទួល (To)</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    placeholder="0x..." 
                                                    className="w-full p-4 pr-12 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm bg-gray-50 focus:bg-white transition-colors"
                                                    value={sendAddress}
                                                    onChange={e => setSendAddress(e.target.value)}
                                                />
                                                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleScanQR} />
                                                <button 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute right-3 top-3 p-2 text-gray-400 hover:text-indigo-600 bg-white rounded-xl shadow-sm border border-gray-100 transition-colors"
                                                    title="Scan QR Image"
                                                >
                                                    {isScanning ? <Loader2 size={18} className="animate-spin"/> : <Camera size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wide">ចំនួន (Amount)</label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    placeholder="0.00" 
                                                    className="w-full p-4 pr-16 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xl bg-gray-50 focus:bg-white transition-colors"
                                                    value={sendAmount}
                                                    onChange={e => setSendAmount(e.target.value)}
                                                />
                                                <div className="absolute right-4 top-4 font-bold text-gray-400">{nativeBalance?.symbol}</div>
                                            </div>
                                        </div>

                                        {sendError && (
                                            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-2">
                                                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                                                <span>{sendError.message}</span>
                                            </div>
                                        )}

                                        <button 
                                            onClick={handleSendTransaction}
                                            disabled={isSendingTx || !sendAddress || !sendAmount}
                                            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                                        >
                                            {isSendingTx ? <Loader2 className="animate-spin"/> : <Send size={20} />}
                                            Send Now
                                        </button>
                                    </div>
                                </div>
                            )}

                            {walletView === 'RECEIVE' && (
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 animate-in slide-in-from-right h-full flex flex-col justify-center items-center">
                                    <div className="flex items-center gap-2 mb-6 w-full md:absolute md:top-6 md:left-6 md:w-auto">
                                        <button onClick={() => setWalletView('MAIN')} className="p-2 hover:bg-gray-100 rounded-full md:hover:bg-indigo-50"><ArrowLeft size={24} /></button>
                                        <h3 className="font-bold text-xl md:text-2xl text-gray-800 md:hidden">Receive</h3>
                                    </div>
                                    
                                    <div className="text-center mb-8">
                                        <h3 className="font-bold text-2xl text-gray-800 mb-2">ទទួលកាក់ (Receive)</h3>
                                        <p className="text-gray-400">Scan code to deposit funds</p>
                                    </div>
                                    
                                    <div className="bg-white p-6 rounded-3xl inline-block mb-8 border border-gray-100 shadow-xl">
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${account.address}`} 
                                            alt="Wallet QR" 
                                            className="rounded-lg mix-blend-multiply opacity-90"
                                        />
                                    </div>

                                    <div className="w-full max-w-md space-y-2">
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide text-center">Wallet Address</p>
                                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between gap-3 border border-gray-200 group hover:border-indigo-300 transition-colors">
                                            <code className="text-sm break-all text-gray-700 font-mono text-left">{account.address}</code>
                                            <button onClick={() => navigator.clipboard.writeText(account.address)} className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors">
                                                <Briefcase size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Manage Assets Modal (View All Supported Tokens) */}
        {isManageAssetsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsManageAssetsOpen(false)}>
                <div 
                    className="bg-white rounded-2xl w-full max-w-sm overflow-hidden relative shadow-xl"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-800">Supported Assets</h3>
                        <button onClick={() => setIsManageAssetsOpen(false)}><X size={20} className="text-gray-400" /></button>
                    </div>
                    <div className="p-2 max-h-[60vh] overflow-y-auto">
                        <p className="text-xs text-gray-500 p-2 mb-2">Listing all supported tokens on Base network.</p>
                        <div className="space-y-1">
                            {walletTokens.map(token => {
                                const price = (token.coingeckoId && walletPrices[token.coingeckoId]) || 0;
                                const valUSD = parseFloat(token.balance) * price;
                                const hasBalance = parseFloat(token.balance) > 0;

                                return (
                                    <div 
                                        key={token.symbol} 
                                        className={`flex items-center justify-between p-3 rounded-xl ${hasBalance ? 'bg-indigo-50 border border-indigo-100' : 'bg-white border border-transparent'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${token.symbol === 'ETH' ? 'bg-blue-600' : 'bg-slate-500'}`}>
                                                {token.symbol[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-800">{token.name}</p>
                                                <p className="text-xs text-gray-500">{Number(token.balance).toFixed(4)} {token.symbol}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {hasBalance && <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Owned</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-100">
                        <button 
                            onClick={() => setIsManageAssetsOpen(false)}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CryptoManager;
