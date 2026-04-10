const OPTS: RequestInit = { credentials: 'include' };

export const fetchRecentTransactions = async (userId: string) => {
  const response = await fetch(`/api/transactions/${userId}`, OPTS);
  if (!response.ok) return [];
  const data = await response.json();
  return data.success ? (data.transactions || []).slice(0, 5) : [];
};

export const fetchSubWallets = async (userId: string) => {
  const response = await fetch(`/api/sub-wallets/${userId}`, OPTS);
  if (!response.ok) return [];
  const data = await response.json();
  return data.success ? [...(data.owned || []), ...(data.shared || [])].slice(0, 2) : [];
};

export const fetchUserData = async (userId: string) => {
  const response = await fetch(`/api/user/${userId}`, OPTS);
  const data = await response.json();
  if (data.success) {
    return data.user;
  } else {
    throw new Error(data.error || 'Failed to fetch user');
  }
};
