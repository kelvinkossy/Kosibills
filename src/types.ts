export type View = 'dashboard' | 'rewards' | 'recommended' | 'bills' | 'settings' | 'airtime' | 'data' | 'electricity' | 'cable' | 'history' | 'terms' | 'betting' | 'internet' | 'sub-wallets' | 'education' | 'other-utilities' | 'admin' | 'agent' | 'customer_care' | 'support' | 'policies' | 'transfer' | 'analytics';

export type AccountTier = 'Basic' | 'Silver' | 'Gold' | 'Premium';

export type TransactionType = 'Airtime' | 'Data' | 'Electricity' | 'Cable TV' | 'Betting' | 'Internet' | 'Education' | 'Other Utilities' | 'Funding' | 'Transfer' | 'Withdrawal' | 'Commission';

export type NotificationType = 'alert' | 'success' | 'info' | 'warning';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  tier: AccountTier;
  pin?: string;
  hasPin?: boolean;
  isBiometricEnabled: boolean;
  isLiveMode: boolean;
  createdAt: string;
  profilePhoto?: string;
  accountStatus?: 'active' | 'frozen';
  kycLevel?: number;
  currency?: string;
  isAgent?: boolean;
  isAdmin?: boolean;
  isCustomerCare?: boolean;
  referralCode?: string;
  hideBalance?: boolean;
  dailyTransferLimit?: number;
  dailyWithdrawalLimit?: number;
  totalReferred?: number;
  bvn?: string;
  lastLoginAt?: string;
  twoFactorEnabled?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  emailReceiptsEnabled?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  date: string;
  description: string;
  tx_ref?: string;
  category?: string;
  balance_after?: number;
  metadata?: string;
}

export interface Receipt {
  transactionId: string;
  date: string;
  amount: number;
  type: string;
  recipient: string;
  status: string;
  reference: string;
  fee: number;
  total: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: NotificationType;
  transactionId?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'user' | 'ai' | 'agent';
  message: string;
  createdAt: string;
}
