export const ACCOUNT_TIERS = {
  'Tier 1': {
    name: 'Tier 1',
    requirement: 'Phone Number + Name',
    dailyLimit: 50000,
    cumulativeBalance: 300000,
  },
  'Tier 2': {
    name: 'Tier 2',
    requirement: 'Verified BVN + NIN',
    dailyLimit: 200000,
    cumulativeBalance: 500000,
  },
  'Tier 3': {
    name: 'Tier 3',
    requirement: 'Power Address Verification',
    dailyLimit: 5000000,
    cumulativeBalance: Infinity,
  },
};

export const NETWORKS = [
  { id: 'mtn', name: 'MTN', color: 'bg-yellow-400', text: 'text-black' },
  { id: 'airtel', name: 'Airtel', color: 'bg-red-600', text: 'text-white' },
  { id: 'glo', name: 'Glo', color: 'bg-green-600', text: 'text-white' },
  { id: '9mobile', name: '9mobile', color: 'bg-emerald-900', text: 'text-white' },
];

export const API_ENDPOINTS = {
  TRANSACTIONS: '/api/transactions',
  SUB_WALLETS: '/api/sub-wallets',
  USER: '/api/user',
  BENEFICIARIES: '/api/beneficiaries',
  NOTIFICATIONS: '/api/notifications',
};
