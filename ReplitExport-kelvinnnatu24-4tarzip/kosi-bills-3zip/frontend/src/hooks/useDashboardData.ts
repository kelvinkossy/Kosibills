import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Transaction, User } from '../types';
import { fetchRecentTransactions, fetchSubWallets, fetchUserData } from '../services/dashboardService';
import { storage } from '../utils/storage';
import { toast } from 'react-hot-toast';

export const useDashboardData = (user: User, setUser: (user: User) => void) => {
  const queryClient = useQueryClient();

  const { data: recentTransactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => fetchRecentTransactions(user.id),
    enabled: !!user?.id,
  });

  const { data: subWallets = [], isLoading: isLoadingWallets } = useQuery({
    queryKey: ['subWallets', user?.id],
    queryFn: () => fetchSubWallets(user.id),
    enabled: !!user?.id,
  });

  const isLoading = isLoadingTransactions || isLoadingWallets;

  const handleRefresh = async () => {
    try {
      const updatedUser = await fetchUserData(user.id);
      setUser(updatedUser);
      storage.set('kosi_user', JSON.stringify(updatedUser));
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['subWallets', user?.id] })
      ]);
      
      toast.success("Dashboard refreshed");
    } catch (error) {
      toast.error("Failed to refresh");
    }
  };

  const fetchRecent = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] }),
      queryClient.invalidateQueries({ queryKey: ['subWallets', user?.id] })
    ]);
  };

  return {
    recentTransactions,
    subWallets,
    isLoading,
    handleRefresh,
    fetchRecent
  };
};
