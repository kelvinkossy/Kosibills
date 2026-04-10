import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Plus, Users, Shield, ArrowRight, X, Loader2 } from 'lucide-react';
import { User } from '../../types';
import toast from 'react-hot-toast';

interface SubWalletsProps {
  user: User;
  onUpdate: () => void;
}

interface SubWallet {
  id: number;
  owner_id: number;
  name: string;
  balance: number;
  members?: Member[];
  allowed_categories?: string;
}

interface Member {
  id: number;
  user_id: number;
  name: string;
  email: string;
  allowed_categories: string;
}

export default function SubWallets({ user, onUpdate }: SubWalletsProps) {
  const [ownedWallets, setOwnedWallets] = useState<SubWallet[]>([]);
  const [sharedWallets, setSharedWallets] = useState<SubWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  
  const [showFundModal, setShowFundModal] = useState<number | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  
  const [showAddMemberModal, setShowAddMemberModal] = useState<number | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);

  const categories = ['Airtime', 'Data', 'Electricity', 'Cable TV', 'Internet', 'Betting'];

  const fetchWallets = async () => {
    try {
      const response = await fetch(`/api/sub-wallets/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setOwnedWallets(data.owned);
        setSharedWallets(data.shared);
      }
    } catch (error) {
      toast.error('Failed to load sub-wallets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [user.id]);

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;
    
    try {
      const response = await fetch('/api/sub-wallets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: user.id, name: newWalletName })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Sub-wallet created successfully');
        setShowCreateModal(false);
        setNewWalletName('');
        fetchWallets();
      } else {
        toast.error(data.error || 'Failed to create sub-wallet');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundAmount || isNaN(Number(fundAmount)) || Number(fundAmount) <= 0) return;
    
    try {
      const response = await fetch('/api/sub-wallets/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, subWalletId: showFundModal, amount: Number(fundAmount) })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Sub-wallet funded successfully');
        setShowFundModal(null);
        setFundAmount('');
        fetchWallets();
        onUpdate();
      } else {
        toast.error(data.error || 'Failed to fund sub-wallet');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || allowedCategories.length === 0) {
      toast.error('Please provide email and select at least one category');
      return;
    }
    
    try {
      const response = await fetch('/api/sub-wallets/add-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subWalletId: showAddMemberModal, 
          email: newMemberEmail,
          allowedCategories: allowedCategories.join(',')
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Member added successfully');
        setShowAddMemberModal(null);
        setNewMemberEmail('');
        setAllowedCategories([]);
        fetchWallets();
      } else {
        toast.error(data.error || 'Failed to add member');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const toggleCategory = (cat: string) => {
    setAllowedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Family & Office Wallets</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Share funds securely with permissions</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
        >
          <Plus className="w-3 h-3" />
          New Wallet
        </button>
      </div>

      {/* Owned Wallets */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase tracking-widest">
          <Wallet className="w-4 h-4 text-emerald-600" />
          Wallets You Manage
        </h3>
        
        {ownedWallets.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">No sub-wallets created.</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="text-emerald-600 text-xs font-bold hover:underline"
            >
              Create first sub-wallet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ownedWallets.map(wallet => (
              <div key={wallet.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{wallet.name}</h4>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">₦{wallet.balance.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setShowFundModal(wallet.id)}
                      className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                      title="Fund Wallet"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => setShowAddMemberModal(wallet.id)}
                      className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      title="Add Member"
                    >
                      <Users className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Members ({wallet.members?.length || 0})</p>
                  {wallet.members && wallet.members.length > 0 ? (
                    <div className="space-y-1">
                      {wallet.members.map(member => (
                        <div key={member.id} className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{member.name}</span>
                          <span className="text-[9px] text-slate-500 truncate max-w-[80px]" title={member.allowed_categories}>
                            {member.allowed_categories}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No members.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shared Wallets */}
      <div className="space-y-2 pt-2">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase tracking-widest">
          <Shield className="w-4 h-4 text-blue-600" />
          Shared With You
        </h3>
        
        {sharedWallets.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">No shared wallets.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sharedWallets.map(wallet => (
              <div key={wallet.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-white shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-white text-sm">{wallet.name}</h4>
                    <p className="text-lg font-black text-emerald-400">₦{wallet.balance.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Categories</p>
                  <div className="flex flex-wrap gap-1">
                    {wallet.allowed_categories?.split(',').map(cat => (
                      <span key={cat} className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] font-bold">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Create Sub-Wallet</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleCreateWallet} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Wallet Name</label>
                  <input
                    type="text"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    placeholder="e.g., Home Expenses, Office Supplies"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    required
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors">
                  Create Wallet
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showFundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Fund Sub-Wallet</h3>
                <button onClick={() => setShowFundModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Funds will be deducted from your main balance (₦{user.balance.toLocaleString()}).
              </p>
              <form onSubmit={handleFundWallet} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    max={user.balance}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white text-lg font-bold"
                    required
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors">
                  Transfer Funds
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Add Member</h3>
                <button onClick={() => setShowAddMemberModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleAddMember} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">User Email</label>
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Allowed Categories</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                          allowedCategories.includes(cat) 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400' 
                            : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors">
                  Add Member
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
