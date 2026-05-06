import { apiFetch } from '../../utils/api';
import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  User as UserIcon, 
  Shield, 
  Bell, 
  Fingerprint, 
  Globe, 
  CreditCard, 
  ChevronRight, 
  LogOut, 
  Key, 
  Smartphone, 
  FileText, 
  HelpCircle,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Verified,
  ShieldCheck,
  Wallet,
  Users,
  Camera,
  Upload
} from 'lucide-react';
import { User, AccountTier, View } from '../../types';
import { storage } from '../../utils/storage';
import BiometricModal from '../common/BiometricModal';

interface SettingsProps {
  user: User;
  setUser: (user: User) => void;
  onLogout: () => void;
  setView: (view: View) => void;
}

export default function Settings({ user, setUser, onLogout, setView }: SettingsProps) {
  const [isLiveMode, setIsLiveMode] = useState(user.isLiveMode || false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(user.isBiometricEnabled || false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(user.twoFactorEnabled || false);
  const [emailReceiptsEnabled, setEmailReceiptsEnabled] = useState(user.emailReceiptsEnabled || false);
  const [hideBalance, setHideBalance] = useState(user.hideBalance || false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [newBeneficiary, setNewBeneficiary] = useState({ name: '', phone: '', serviceType: 'Airtime', provider: 'MTN' });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  React.useEffect(() => {
    fetchBeneficiaries();
  }, [user.id]);

  const fetchBeneficiaries = () => {
    fetch(`/api/beneficiaries/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBeneficiaries(data.beneficiaries);
        }
      })
      .catch(err => console.error('Failed to fetch beneficiaries:', err));
  };

  const handleAddBeneficiary = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch('/api/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newBeneficiary, userId: user.id })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Beneficiary added');
        setNewBeneficiary({ name: '', phone: '', serviceType: 'Airtime', provider: 'MTN' });
        fetchBeneficiaries();
      } else {
        toast.error('Failed to add beneficiary');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleDeleteBeneficiary = async (id: number) => {
    try {
      const response = await apiFetch(`/api/beneficiaries/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast.success('Beneficiary deleted');
        fetchBeneficiaries();
      } else {
        toast.error('Failed to delete beneficiary');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [pinData, setPinData] = useState({ current: '', new: '', confirm: '' });

  const handleSendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone })
      });
      const data = await response.json();
      if (data.success) {
        setShowOtpModal(true);
        toast.success('OTP sent to your phone');
      } else {
        toast.error('Failed to send OTP');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, otp })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Phone number verified successfully!');
        setShowOtpModal(false);
        // In a real app, update user status in DB
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const tiers: { name: AccountTier; limit: string; fee: string; color: string }[] = [
    { name: 'Basic', limit: '₦50,000/day', fee: '1.5%', color: 'bg-slate-100 text-slate-600' },
    { name: 'Silver', limit: '₦200,000/day', fee: '1.2%', color: 'bg-slate-200 text-slate-700' },
    { name: 'Gold', limit: '₦1,000,000/day', fee: '0.8%', color: 'bg-amber-100 text-amber-700' },
    { name: 'Premium', limit: 'Unlimited', fee: '0.5%', color: 'bg-emerald-100 text-emerald-700' },
  ];

  const handleToggleLiveMode = async () => {
    const newValue = !isLiveMode;
    if (!window.confirm(`Are you sure you want to ${newValue ? 'enable' : 'disable'} Live Mode? Real funds will be used in Live Mode.`)) return;
    
    try {
      const response = await apiFetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isLiveMode: newValue })
      });
      const data = await response.json();
      if (data.success) {
        setIsLiveMode(newValue);
        setUser(data.user);
        toast.success(`Live mode ${newValue ? 'enabled' : 'disabled'}`);
      } else {
        toast.error('Failed to update live mode');
      }
    } catch (err) {
      console.error('Failed to update live mode', err);
      toast.error('Network error. Please try again.');
    }
  };

  const handleToggleBiometric = async () => {
    const newValue = !isBiometricEnabled;
    
    // If enabling, prompt for biometric authentication
    if (newValue) {
      setShowBiometricModal(true);
      return;
    }

    // If disabling, just update
    updateBiometricSetting(false);
  };

  const handleToggleHideBalance = async () => {
    const newValue = !hideBalance;
    try {
      const response = await apiFetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, hideBalance: newValue })
      });
      const data = await response.json();
      if (data.success) {
        setHideBalance(newValue);
        setUser(data.user);
        toast.success(`Balance ${newValue ? 'hidden' : 'visible'}`);
      }
    } catch (err) {
      toast.error('Failed to update balance visibility');
    }
  };

  const updateBiometricSetting = async (enabled: boolean) => {
    try {
      const response = await apiFetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isBiometricEnabled: enabled })
      });
      const data = await response.json();
      if (data.success) {
        setIsBiometricEnabled(enabled);
        setUser(data.user);
        setShowBiometricModal(false);
        toast.success(`Biometric authentication ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        toast.error('Failed to update biometric settings');
      }
    } catch (err) {
      console.error('Failed to update biometric', err);
      toast.error('Network error. Please try again.');
    }
  };

  const handleToggle2FA = async () => {
    const newValue = !is2FAEnabled;
    setIs2FAEnabled(newValue);
    try {
      const response = await apiFetch('/api/auth/2fa/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue })
      });
      const data = await response.json();
      if (data.success) {
        setUser({ ...user, twoFactorEnabled: newValue });
        toast.success(`2FA ${newValue ? 'enabled' : 'disabled'}`);
      } else {
        setIs2FAEnabled(!newValue);
        toast.error(data.error || 'Failed to update 2FA');
      }
    } catch (err) {
      setIs2FAEnabled(!newValue);
      toast.error('Network error');
    }
  };

  const handleToggleEmailReceipts = async () => {
    const newValue = !emailReceiptsEnabled;
    setEmailReceiptsEnabled(newValue);
    try {
      const response = await apiFetch('/api/user/toggle-email-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue })
      });
      const data = await response.json();
      if (data.success) {
        setUser({ ...user, emailReceiptsEnabled: newValue });
        toast.success(`Email receipts ${newValue ? 'enabled' : 'disabled'}`);
      } else {
        setEmailReceiptsEnabled(!newValue);
        toast.error('Failed to update preference');
      }
    } catch (err) {
      setEmailReceiptsEnabled(!newValue);
      toast.error('Network error');
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('userId', user.id);

      const response = await apiFetch('/api/user/upload-photo', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        storage.set('kosi_user', JSON.stringify(data.user));
        toast.success('Profile photo updated successfully!');
      } else {
        toast.error(data.error || 'Failed to upload photo');
      }
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleUpgradeTier = async (tierName: AccountTier) => {
    if (user.tier === tierName) return;
    try {
      const response = await apiFetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, tier: tierName })
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        storage.set('kosi_user', JSON.stringify(data.user));
        toast.success(`Account upgraded to ${tierName} tier!`);
      } else {
        toast.error('Failed to upgrade account tier');
      }
    } catch (err) {
      console.error('Failed to upgrade tier', err);
      toast.error('Network error. Please try again.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, password: passwordData.new })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Password updated successfully');
        setTimeout(() => setShowPasswordModal(false), 2000);
      }
    } catch (err) {
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinData.new !== pinData.confirm) {
      toast.error('PINs do not match');
      return;
    }
    if (pinData.new.length !== 4 || !/^\d+$/.test(pinData.new)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    setIsLoading(true);
    try {
      // First verify the current password
      const authResponse = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: pinData.current })
      });
      const authData = await authResponse.json();
      
      if (!authData.success) {
        toast.error('Incorrect current password');
        setIsLoading(false);
        return;
      }

      // If password is correct, update the PIN
      const response = await apiFetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, pin: pinData.new })
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        storage.set('kosi_user', JSON.stringify(data.user));
        toast.success('PIN reset successfully');
        setTimeout(() => setShowPinModal(false), 2000);
      }
    } catch (err) {
      toast.error('Failed to reset PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const response = await apiFetch('/api/user/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, profilePhoto: base64String })
        });
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          storage.set('kosi_user', JSON.stringify(data.user));
          toast.success('Profile photo updated');
        }
      } catch (err) {
        toast.error('Failed to update photo');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* KYC Status Card */}
      <div className="premium-card p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Verified className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Account Tier</p>
              <h3 className="text-lg font-black">Tier 1 (Starter)</h3>
            </div>
          </div>
          <button className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg font-bold text-xs hover:bg-emerald-600 transition-colors">
            Upgrade
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 relative z-10">
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <p className="text-slate-400 text-[9px] font-bold uppercase">Daily Limit</p>
            <p className="text-xs font-black">₦50,000.00</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <p className="text-slate-400 text-[9px] font-bold uppercase">Max Balance</p>
            <p className="text-xs font-black">₦300,000.00</p>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none flex flex-col md:flex-row items-center gap-4">
        <div className="relative group">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden relative">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon className="w-10 h-10" />
            )}
          </div>
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            <span className="text-[10px] font-bold">Change</span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>
        <div className="flex-1 text-center md:text-left space-y-0.5">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email} • {user.phone}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mt-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${tiers.find(t => t.name === user.tier)?.color}`}>
              {user.tier} Account
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${user.accountStatus === 'frozen' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {user.accountStatus === 'frozen' ? 'Frozen' : 'Active'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-600">
              KYC Level {user.kycLevel || 1}
            </span>
            {isLiveMode && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-600 flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" /> Live Mode
              </span>
            )}
          </div>
        </div>
        <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-all">
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Tiers */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white px-2">Account Tiers</h3>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
            {tiers.map((tier) => (
              <div 
                key={tier.name}
                className={`p-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-0 ${user.tier === tier.name ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 dark:text-white text-xs">{tier.name}</span>
                    {user.tier === tier.name && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  </div>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400">Limit: {tier.limit}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{tier.fee} Fee</p>
                  {user.tier !== tier.name && (
                    <button 
                      onClick={() => handleUpgradeTier(tier.name)}
                      className="text-[9px] font-bold uppercase text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-8">
          {/* Security & System */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white px-2">Security & System</h3>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg divide-y divide-slate-100 dark:divide-slate-800">
              {/* Live Mode Toggle */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs">Live Mode</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Switch to real transactions</p>
                  </div>
                </div>
                <button 
                  onClick={handleToggleLiveMode}
                  className={`w-10 h-6 rounded-full transition-all relative ${isLiveMode ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${isLiveMode ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Biometrics Toggle */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs">Biometric Login</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Use fingerprint for faster access</p>
                  </div>
                </div>
                <button 
                  onClick={handleToggleBiometric}
                  className={`w-10 h-6 rounded-full transition-all relative ${isBiometricEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${isBiometricEnabled ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Hide Balance Toggle */}
              <div className="p-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                    {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs">Hide Balance</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Mask your balance on the dashboard</p>
                  </div>
                </div>
                <button 
                  onClick={handleToggleHideBalance}
                  className={`w-10 h-6 rounded-full transition-all relative ${hideBalance ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${hideBalance ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Email Receipts Toggle */}
              <div className="p-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs">Email Receipts</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Receive receipts for every transaction</p>
                  </div>
                </div>
                <button 
                  onClick={handleToggleEmailReceipts}
                  className={`w-10 h-6 rounded-full transition-all relative ${emailReceiptsEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${emailReceiptsEnabled ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Transaction PIN */}
              <button 
                onClick={() => {
                  setShowPinModal(true);
                }}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Key className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 dark:text-white">Reset Transaction PIN</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Reset your 4-digit security PIN</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>

              {/* Phone Verification */}
              <button 
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 dark:text-white">Verify Phone Number</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Secure your account with Termii SMS OTP</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase py-1 px-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg">Unverified</span>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </button>

              {/* Change Password */}
              <button 
                onClick={() => {
                  setShowPasswordModal(true);
                }}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 dark:text-white">Change Password</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Update your account login password</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>

              {/* 2FA Toggle */}
              <div className="p-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs">Two-Factor Auth (2FA)</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Secure login with email verification</p>
                  </div>
                </div>
                <button 
                  onClick={handleToggle2FA}
                  className={`w-10 h-6 rounded-full transition-all relative ${is2FAEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${is2FAEnabled ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Manage Sub-Wallets */}
              <button 
                onClick={() => setView('sub-wallets')}
                className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs">Manage Sub-Wallets</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Create and manage shared wallets</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Admin Dashboard */}
              {user.isAdmin && (
                <button 
                  onClick={() => setView('admin')}
                  className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-t border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-800 dark:text-white text-xs">Admin Dashboard</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Manage users and agents</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}
              {/* Agent Dashboard */}
              {user.isAgent && (
                <button 
                  onClick={() => setView('agent')}
                  className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-t border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-800 dark:text-white text-xs">Agent Dashboard</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Manage your agent account</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}
              {/* Customer Care Dashboard */}
              {user.isCustomerCare && (
                <button 
                  onClick={() => setView('customer_care')}
                  className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-t border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-800 dark:text-white text-xs">Customer Care Dashboard</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Support users and resolve issues</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Beneficiaries Management */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white px-2">Manage Beneficiaries</h3>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 space-y-3">
              <form onSubmit={handleAddBeneficiary} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input type="text" placeholder="Name" value={newBeneficiary.name} onChange={e => setNewBeneficiary({...newBeneficiary, name: e.target.value})} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs" required />
                <input type="tel" placeholder="Phone" value={newBeneficiary.phone} onChange={e => setNewBeneficiary({...newBeneficiary, phone: e.target.value})} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs" required />
                <select value={newBeneficiary.serviceType} onChange={e => setNewBeneficiary({...newBeneficiary, serviceType: e.target.value})} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs">
                  <option value="Airtime">Airtime</option>
                  <option value="Data">Data</option>
                </select>
                <select value={newBeneficiary.provider} onChange={e => setNewBeneficiary({...newBeneficiary, provider: e.target.value})} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs">
                  <option value="MTN">MTN</option>
                  <option value="Airtel">Airtel</option>
                  <option value="Glo">Glo</option>
                  <option value="9mobile">9mobile</option>
                </select>
                <button type="submit" className="md:col-span-2 bg-emerald-600 text-white p-2 rounded-lg font-bold text-xs">Add Beneficiary</button>
              </form>
              <div className="space-y-1">
                {beneficiaries.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-bold text-xs">{b.name}</p>
                      <p className="text-[10px] text-slate-500">{b.phone} ({b.service_type} - {b.provider})</p>
                    </div>
                    <button onClick={() => handleDeleteBeneficiary(b.id)} className="text-red-500 font-bold text-[10px]">Delete</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legal & Support */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white px-2">Legal & Support</h3>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
              <button 
                onClick={() => setView('terms')}
                className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs">Terms & Conditions</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Read our terms of use</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button 
                onClick={() => setView('policies')}
                className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs">Safety & Policies</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">OPay & PalmPay style security policies</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs">Help & Support</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Get assistance with your transactions</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <button 
            onClick={onLogout}
            className="w-full p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 flex items-center justify-between hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-red-600 dark:text-red-400 text-xs">Sign Out</h4>
                <p className="text-[10px] text-red-500/70 dark:text-red-400/70">Securely log out of your account</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showBiometricModal && (
          <BiometricModal
            onSuccess={() => updateBiometricSetting(true)}
            onCancel={() => setShowBiometricModal(false)}
            title="Enable Biometric Login"
            description="Verify your fingerprint to enable biometric authentication for your account"
          />
        )}

        {showPasswordModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Change Password</h3>
                <button onClick={() => setShowPasswordModal(false)}><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">New Password</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-500 dark:text-white"
                    onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Confirm Password</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-500 dark:text-white"
                    onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-70"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showPinModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Reset Transaction PIN</h3>
                <button onClick={() => setShowPinModal(false)}><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <form onSubmit={handleChangePin} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Current Password</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-500 dark:text-white"
                    onChange={(e) => setPinData({...pinData, current: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">New 4-Digit PIN</label>
                  <input 
                    type="password" 
                    maxLength={4}
                    required 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-500 text-center text-2xl tracking-[1em] dark:text-white"
                    onChange={(e) => setPinData({...pinData, new: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Confirm New PIN</label>
                  <input 
                    type="password" 
                    maxLength={4}
                    required 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-500 text-center text-2xl tracking-[1em] dark:text-white"
                    onChange={(e) => setPinData({...pinData, confirm: e.target.value})}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-70"
                >
                  {isLoading ? 'Resetting...' : 'Reset PIN'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showOtpModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Verify Phone</h3>
                <button onClick={() => setShowOtpModal(false)}><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We've sent a 6-digit code to <span className="font-bold text-slate-800 dark:text-white">{user.phone}</span>. 
                Enter it below to verify your account.
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Verification Code</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    required 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-500 text-center text-2xl tracking-[0.5em] font-bold dark:text-white"
                    placeholder="000000"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  Verify Now
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
